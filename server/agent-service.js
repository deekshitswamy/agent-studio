#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateTaskFile } = require("../src/task-file");

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const SUPPORTED_AGENTS = Object.freeze(["pm", "architect", "task-planner", "dev", "qa"]);
const RUN_ARTIFACT_DIR = path.resolve(__dirname, "..", ".local", "runs");
const UI_INDEX_PATH = path.resolve(__dirname, "..", "ui", "index.html");
const TASKS_DIR_PATH = path.resolve(__dirname, "..", "tasks");
const PROJECTS_DIR_PATH = path.resolve(__dirname, "..", "projects");

function getServerConfig(env = process.env) {
  const rawPort = env.PORT;
  const parsedPort = rawPort ? Number(rawPort) : DEFAULT_PORT;

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }

  return {
    host: env.HOST || DEFAULT_HOST,
    port: parsedPort
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendHtml(response, statusCode, html) {
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8"
  });
  response.end(html);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8").trim();

      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
}

function validateRunRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  if (typeof body.contextPack !== "string" || !body.contextPack.trim()) {
    throw new Error("POST /runs requires `contextPack`.");
  }

  if (typeof body.agent !== "string" || !body.agent.trim()) {
    throw new Error("POST /runs requires `agent`.");
  }

  const agent = body.agent.trim();

  if (!SUPPORTED_AGENTS.includes(agent)) {
    throw new Error(`Unsupported agent: ${agent}`);
  }

  if (agent === "dev" && (typeof body.task !== "string" || !body.task.trim())) {
    throw new Error("Dev runs require explicit `task`.");
  }

  if (
    body.project !== undefined &&
    body.project !== null &&
    (typeof body.project !== "string" || !body.project.trim())
  ) {
    throw new Error("POST /runs `project` must be a non-empty string when provided.");
  }
}

function createRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${timestamp}-${process.pid}`;
}

function getRunArtifactDirectoryForProject(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    return RUN_ARTIFACT_DIR;
  }

  const normalizedProjectId = normalizeProjectId(projectId);
  return path.join(PROJECTS_DIR_PATH, normalizedProjectId, ".local", "runs");
}

function ensureRunArtifactDir(projectId = "") {
  fs.mkdirSync(getRunArtifactDirectoryForProject(projectId), { recursive: true });
}

function buildRunCommand(body) {
  const args = ["./bin/run-agent.js", body.contextPack.trim(), "--agent", body.agent.trim()];

  if (body.llm === true) {
    args.push("--llm");
  }

  if (typeof body.task === "string" && body.task.trim()) {
    args.push("--task", body.task.trim());
  }

  if (typeof body.withArtifact === "string" && body.withArtifact.trim()) {
    args.push("--with-artifact", body.withArtifact.trim());
  }

  return args;
}

function runAgentStudioCommand({ body, repoRoot }) {
  const startedAt = new Date().toISOString();
  const id = createRunId();
  const logId = `${id}.log`;
  const runArtifactDir = getRunArtifactDirectoryForProject(body.project || "");
  const metadataPath = path.join(runArtifactDir, `${id}.json`);
  const logPath = path.join(runArtifactDir, logId);
  const args = buildRunCommand(body);
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const completedAt = new Date().toISOString();
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const exitCode = typeof result.status === "number" ? result.status : 1;
  const status = exitCode === 0 ? "completed" : "failed";

  const logOutput = [
    `command: ${[process.execPath, ...args].join(" ")}`,
    `startedAt: ${startedAt}`,
    `completedAt: ${completedAt}`,
    `exitCode: ${exitCode}`,
    "",
    "stdout:",
    stdout,
    "",
    "stderr:",
    stderr
  ].join("\n");

  fs.writeFileSync(logPath, `${logOutput}\n`, "utf8");

  const metadata = {
    id,
    agent: body.agent.trim(),
    contextPack: body.contextPack.trim(),
    status,
    exitCode,
    logId,
    startedAt,
    completedAt
  };

  if (typeof body.project === "string" && body.project.trim()) {
    metadata.project = normalizeProjectId(body.project);
  }

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return metadata;
}

function validateRunArtifactId(runId) {
  if (typeof runId !== "string" || !runId.trim()) {
    const error = new Error("Not found.");
    error.statusCode = 404;
    throw error;
  }

  const normalizedId = runId.trim();

  if (normalizedId.includes("/") || normalizedId.includes("\\") || normalizedId.includes("..")) {
    const error = new Error(`Invalid run id: ${normalizedId}`);
    error.statusCode = 400;
    throw error;
  }

  return normalizedId;
}

function getRunMetadataPath(runId, projectId = "") {
  return path.join(
    getRunArtifactDirectoryForProject(projectId),
    `${validateRunArtifactId(runId)}.json`
  );
}

function getRunLogPath(runId, projectId = "") {
  return path.join(
    getRunArtifactDirectoryForProject(projectId),
    `${validateRunArtifactId(runId)}.log`
  );
}

function readRunMetadata(runId, projectId = "") {
  const metadataPath = getRunMetadataPath(runId, projectId);

  if (!fs.existsSync(metadataPath)) {
    const error = new Error(`Run not found: ${runId}`);
    error.statusCode = 404;
    throw error;
  }

  try {
    return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch (error) {
    const parseError = new Error(`Run metadata is invalid for: ${runId}`);
    parseError.statusCode = 500;
    throw parseError;
  }
}

function readRunLog(runId, projectId = "") {
  const logPath = getRunLogPath(runId, projectId);

  if (!fs.existsSync(logPath)) {
    const error = new Error(`Log not found: ${runId}`);
    error.statusCode = 404;
    throw error;
  }

  return fs.readFileSync(logPath, "utf8");
}

function extractStdoutFromRunLog(logContent) {
  const stdoutMarker = "\nstdout:\n";
  const stderrMarker = "\n\nstderr:\n";
  const stdoutStart = logContent.indexOf(stdoutMarker);

  if (stdoutStart === -1) {
    return "";
  }

  const contentStart = stdoutStart + stdoutMarker.length;
  const stderrStart = logContent.indexOf(stderrMarker, contentStart);
  const stdoutContent =
    stderrStart === -1
      ? logContent.slice(contentStart)
      : logContent.slice(contentStart, stderrStart);

  return stdoutContent.trim();
}

function readTaskPlannerSource(runId, projectId = "") {
  const metadata = readRunMetadata(runId, projectId);

  if (metadata.agent !== "task-planner" || metadata.status !== "completed") {
    return {
      detected: false,
      runId,
      agent: metadata.agent,
      status: metadata.status,
      sourceText: null
    };
  }

  const logContent = readRunLog(runId, projectId);
  const sourceText = extractStdoutFromRunLog(logContent);

  return {
    detected: sourceText.length > 0,
    runId,
    agent: metadata.agent,
    status: metadata.status,
    sourceText: sourceText || null
  };
}

function readUiIndexHtml() {
  if (!fs.existsSync(UI_INDEX_PATH)) {
    const error = new Error("UI entry point not found.");
    error.statusCode = 404;
    throw error;
  }

  return fs.readFileSync(UI_INDEX_PATH, "utf8");
}

function normalizeProjectId(projectId) {
  const normalized = projectId.trim();

  if (!/^[A-Za-z0-9][A-Za-z0-9-_]*$/.test(normalized)) {
    const error = new Error("Project id must use only letters, numbers, hyphens, or underscores.");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function getTasksDirectoryForProject(projectId) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    return {
      rootPath: TASKS_DIR_PATH,
      pathPrefix: "tasks/"
    };
  }

  const normalizedProjectId = normalizeProjectId(projectId);

  return {
    rootPath: path.join(PROJECTS_DIR_PATH, normalizedProjectId, "tasks"),
    pathPrefix: `projects/${normalizedProjectId}/tasks/`
  };
}

function listSavedTaskFiles(projectId = "") {
  const { rootPath, pathPrefix } = getTasksDirectoryForProject(projectId);

  if (!fs.existsSync(rootPath)) {
    return [];
  }

  return fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => ({
      name: entry.name,
      path: `${pathPrefix}${entry.name}`
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function validateTaskSaveRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }

  if (typeof body.taskId !== "string" || !body.taskId.trim()) {
    throw new Error("POST /tasks requires `taskId`.");
  }

  if (typeof body.title !== "string" || !body.title.trim()) {
    throw new Error("POST /tasks requires `title`.");
  }

  if (typeof body.body !== "string" || !body.body.trim()) {
    throw new Error("POST /tasks requires `body`.");
  }

  if (typeof body.contextPack !== "string" || !body.contextPack.trim()) {
    throw new Error("POST /tasks requires `contextPack`.");
  }

  if (
    body.project !== undefined &&
    body.project !== null &&
    (typeof body.project !== "string" || !body.project.trim())
  ) {
    throw new Error("POST /tasks `project` must be a non-empty string when provided.");
  }
}

function normalizeTaskId(taskId) {
  const normalized = taskId.trim().replace(/\.md$/i, "");

  if (!/^[A-Za-z0-9][A-Za-z0-9-_]*$/.test(normalized)) {
    throw new Error("Task id must use only letters, numbers, hyphens, or underscores.");
  }

  return normalized;
}

function getSavedTaskPath(taskId, projectId = "") {
  const normalizedTaskId = normalizeTaskId(taskId);
  const { rootPath, pathPrefix } = getTasksDirectoryForProject(projectId);

  return {
    absolutePath: path.join(rootPath, `${normalizedTaskId}.md`),
    relativePath: `${pathPrefix}${normalizedTaskId}.md`,
    rootPath
  };
}

function parseDraftSections(markdown) {
  const sections = new Map();
  let currentSection = null;
  let currentLines = [];

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.*)$/);

    if (match) {
      if (currentSection) {
        sections.set(currentSection, currentLines);
      }
      currentSection = match[1].trim();
      currentLines = [];
      continue;
    }

    if (currentSection) {
      currentLines.push(line);
    }
  }

  if (currentSection) {
    sections.set(currentSection, currentLines);
  }

  return sections;
}

function trimSectionLines(lines = []) {
  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  return lines;
}

function buildSectionLines({ preferredLines, fallbackLines }) {
  const normalizedPreferred = trimSectionLines([...(preferredLines || [])]);

  if (normalizedPreferred.length > 0) {
    return normalizedPreferred;
  }

  return trimSectionLines([...(fallbackLines || [])]);
}

function buildSavedTaskMarkdown({ taskId, title, body, contextPack }) {
  const normalizedTaskId = normalizeTaskId(taskId);
  const normalizedTitle = title.trim();
  const normalizedContextPack = contextPack.trim();
  const normalizedBody = body.trim();
  const draftSections = parseDraftSections(normalizedBody);
  const hasStructuredSections = draftSections.size > 0;

  const sectionContent = new Map([
    [
      "Task",
      [`- \`${normalizedTaskId}\``]
    ],
    [
      "Status",
      buildSectionLines({
        preferredLines: draftSections.get("Status"),
        fallbackLines: ["- `pending`"]
      })
    ],
    [
      "Objective",
      buildSectionLines({
        preferredLines: draftSections.get("Objective"),
        fallbackLines: [`- ${normalizedTitle}`]
      })
    ],
    [
      "Context Pack",
      [`- \`${normalizedContextPack}\``]
    ],
    [
      "Scope",
      buildSectionLines({
        preferredLines: draftSections.get("Scope"),
        fallbackLines: [
          "- Review and refine the saved draft content below.",
          "- Keep changes bounded to the selected task."
        ]
      })
    ],
    [
      "Out of Scope",
      buildSectionLines({
        preferredLines: draftSections.get("Out of Scope"),
        fallbackLines: [
          "- Automatic execution",
          "- Queue insertion",
          "- Background jobs"
        ]
      })
    ],
    [
      "Acceptance Criteria",
      buildSectionLines({
        preferredLines: draftSections.get("Acceptance Criteria"),
        fallbackLines: [
          "- Reviewed draft content is preserved in this file.",
          "- The saved task file remains human-controlled."
        ]
      })
    ],
    [
      "Verification",
      buildSectionLines({
        preferredLines: draftSections.get("Verification"),
        fallbackLines: [`- \`node ./bin/run-agent.js task validate tasks/${normalizedTaskId}.md\``]
      })
    ],
    [
      "Dev Handoff",
      buildSectionLines({
        preferredLines: draftSections.get("Dev Handoff"),
        fallbackLines: hasStructuredSections
          ? [
              "- Review the normalized sections above before running Dev.",
              "- Keep the task human-reviewed and human-selected."
            ]
          : [
              "- Reviewed draft source:",
              "",
              normalizedBody
            ]
      })
    ]
  ]);

  const output = [`# Task: ${normalizedTitle}`, ""];

  for (const [sectionName, lines] of sectionContent.entries()) {
    output.push(`## ${sectionName}`, "");
    output.push(...lines);
    output.push("");
  }

  return output.join("\n").trimEnd();
}

function saveReviewedTaskDraft(body) {
  validateTaskSaveRequest(body);

  const taskLocation = getSavedTaskPath(body.taskId, body.project || "");

  if (fs.existsSync(taskLocation.absolutePath)) {
    const error = new Error(`Task file already exists: ${taskLocation.relativePath}`);
    error.statusCode = 409;
    throw error;
  }

  fs.mkdirSync(taskLocation.rootPath, { recursive: true });

  const markdown = buildSavedTaskMarkdown(body);
  fs.writeFileSync(taskLocation.absolutePath, `${markdown}\n`, "utf8");

  const validation = validateTaskFile(taskLocation.absolutePath);

  if (!validation.valid) {
    fs.unlinkSync(taskLocation.absolutePath);
    const error = new Error(`Saved task file failed validation: ${validation.errors.join("; ")}`);
    error.statusCode = 500;
    throw error;
  }

  return {
    saved: true,
    task: {
      name: path.basename(taskLocation.absolutePath),
      path: taskLocation.relativePath
    },
    validation: {
      valid: true
    }
  };
}

function createAgentServiceServer({ repoRoot = path.resolve(__dirname, "..") } = {}) {
  return http.createServer(async (request, response) => {
    if (!request.url) {
      sendJson(response, 400, {
        error: "Missing request URL."
      });
      return;
    }

    const method = request.method || "GET";
    const url = new URL(request.url, "http://127.0.0.1");

    if (method === "GET" && url.pathname === "/") {
      sendJson(response, 200, {
        name: "Agent Studio API",
        status: "ok",
        version: "v7-skeleton",
        routes: ["/", "/ui", "/health", "/agents", "/tasks", "/runs/:id", "/logs/:id"]
      });
      return;
    }

    if (method === "GET" && (url.pathname === "/ui" || url.pathname === "/ui/")) {
      try {
        const html = readUiIndexHtml();
        sendHtml(response, 200, html);
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, {
        status: "ok"
      });
      return;
    }

    if (method === "GET" && url.pathname === "/agents") {
      sendJson(response, 200, {
        agents: SUPPORTED_AGENTS
      });
      return;
    }

    if (method === "GET" && url.pathname === "/tasks") {
      try {
        const projectId = url.searchParams.get("project") || "";
        sendJson(response, 200, {
          tasks: listSavedTaskFiles(projectId),
          project: projectId.trim() || null
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/runs/") && url.pathname.endsWith("/task-planner-source")) {
      const runId = decodeURIComponent(
        url.pathname.slice("/runs/".length, -"/task-planner-source".length)
      ).trim();
      const projectId = url.searchParams.get("project") || "";

      if (!runId) {
        sendJson(response, 404, {
          error: "Not found."
        });
        return;
      }

      try {
        const sourcePayload = readTaskPlannerSource(runId, projectId);
        sendJson(response, 200, sourcePayload);
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/runs/")) {
      const runId = decodeURIComponent(url.pathname.slice("/runs/".length)).trim();
      const projectId = url.searchParams.get("project") || "";

      if (!runId) {
        sendJson(response, 404, {
          error: "Not found."
        });
        return;
      }

      try {
        const metadata = readRunMetadata(runId, projectId);
        sendJson(response, 200, metadata);
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname.startsWith("/logs/")) {
      const runId = decodeURIComponent(url.pathname.slice("/logs/".length)).trim();
      const projectId = url.searchParams.get("project") || "";

      if (!runId) {
        sendJson(response, 404, {
          error: "Not found."
        });
        return;
      }

      try {
        const logContent = readRunLog(runId, projectId);
        response.writeHead(200, {
          "Content-Type": "text/plain; charset=utf-8"
        });
        response.end(logContent);
      } catch (error) {
        sendJson(response, error.statusCode || 500, {
          error: error.message
        });
      }
      return;
    }

    if (method === "POST" && url.pathname === "/tasks") {
      try {
        const body = await readJsonBody(request);
        const result = saveReviewedTaskDraft(body);
        sendJson(response, 201, result);
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: error.message
        });
      }
      return;
    }

    if (method === "POST" && url.pathname === "/runs") {
      try {
        const body = await readJsonBody(request);
        validateRunRequest(body);
        ensureRunArtifactDir(body.project || "");

        const metadata = runAgentStudioCommand({
          body,
          repoRoot
        });

        sendJson(response, 200, metadata);
      } catch (error) {
        sendJson(response, 400, {
          error: error.message
        });
      }
      return;
    }

    sendJson(response, 404, {
      error: "Not found."
    });
  });
}

function startAgentService({ env = process.env, stdout = process.stdout, stderr = process.stderr } = {}) {
  const { host, port } = getServerConfig(env);
  const server = createAgentServiceServer();

  server.on("error", (error) => {
    stderr.write(`Agent Studio API server failed: ${error.message}\n`);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    stdout.write(`Agent Studio API server listening on http://${host}:${port}\n`);
  });

  return server;
}

if (require.main === module) {
  startAgentService();
}

module.exports = {
  RUN_ARTIFACT_DIR,
  SUPPORTED_AGENTS,
  buildRunCommand,
  createAgentServiceServer,
  getServerConfig,
  getRunLogPath,
  getRunMetadataPath,
  getSavedTaskPath,
  readRunLog,
  readRunMetadata,
  runAgentStudioCommand,
  saveReviewedTaskDraft,
  startAgentService
};
