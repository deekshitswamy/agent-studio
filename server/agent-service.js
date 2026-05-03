#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawnSync } = require("child_process");
const { validateTaskFile } = require("../src/task-file");
const { validateStructuredWriteArtifactShape } = require("../src/dev-write-artifacts");
const { resolveSafeProjectWritePath } = require("../src/mcp/safe-write-paths");

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const SUPPORTED_AGENTS = Object.freeze(["pm", "architect", "task-planner", "dev", "qa"]);
const PROJECT_RUNNER_SERVICE_NAME = "agent-studio-project-runner";
const RUN_ARTIFACT_DIR = path.resolve(__dirname, "..", ".local", "runs");
const UI_INDEX_PATH = path.resolve(__dirname, "..", "ui", "index.html");
const TASKS_DIR_PATH = path.resolve(__dirname, "..", "tasks");
const PROJECTS_DIR_PATH = path.resolve(__dirname, "..", "projects");
const PROJECT_RUNNER_HOST_REQUIRED_ERROR =
  "Project-scoped runs require the API server to run on the host. The Dockerized API container supports UI and global runs, but it cannot launch the project runner.";
const HIDDEN_PROJECT_SEGMENTS = new Set([".local"]);

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
    body.idea !== undefined &&
    body.idea !== null &&
    (typeof body.idea !== "string" || !body.idea.trim())
  ) {
    throw new Error("POST /runs `idea` must be a non-empty string when provided.");
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
  return ["./bin/run-agent.js", ...buildRunAgentArguments(body)];
}

function buildRunAgentArguments(body) {
  const args = [body.contextPack.trim(), "--agent", body.agent.trim()];

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

function buildIdeaArtifactMarkdown(idea) {
  return [
    "# Idea",
    "",
    idea.trim(),
    "",
    "## Notes",
    "",
    "- Treat this as optional supporting material for the current run.",
    "- Keep the context pack as the primary input."
  ].join("\n");
}

function buildProjectRunnerCommand({ body, repoRoot, projectId }) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const hostProjectPath = path.join(repoRoot, "projects", normalizedProjectId);
  const containerProjectPath = `/workspace/projects/${normalizedProjectId}`;
  const hostLogsPath = path.join(repoRoot, "logs");

  return {
    command: "docker",
    args: [
      "compose",
      "run",
      "--rm",
      "-T",
      "-v",
      `${repoRoot}:/workspace:ro`,
      "-v",
      `${hostProjectPath}:${containerProjectPath}`,
      "-v",
      `${hostLogsPath}:/workspace/logs`,
      PROJECT_RUNNER_SERVICE_NAME,
      ...buildRunAgentArguments(body)
    ],
    options: {
      cwd: repoRoot,
      encoding: "utf8"
    }
  };
}

function assertProjectRunnerExecutionAvailable() {
  if (String(process.env.AGENT_STUDIO_CONTAINERIZED || "").toLowerCase() === "true") {
    const error = new Error(PROJECT_RUNNER_HOST_REQUIRED_ERROR);
    error.statusCode = 400;
    throw error;
  }

  const dockerCheck = spawnSync("docker", ["compose", "version"], {
    encoding: "utf8"
  });

  if (dockerCheck.error || dockerCheck.status !== 0) {
    const error = new Error(
      "Project-scoped runs require Docker Compose to be available on the host API machine."
    );
    error.statusCode = 400;
    throw error;
  }
}

function executeRunProcess({ body, repoRoot }) {
  if (typeof body.project === "string" && body.project.trim()) {
    assertProjectRunnerExecutionAvailable();

    const projectCommand = buildProjectRunnerCommand({
      body,
      repoRoot,
      projectId: body.project.trim()
    });

    return {
      invocation: [projectCommand.command, ...projectCommand.args],
      result: spawnSync(projectCommand.command, projectCommand.args, projectCommand.options)
    };
  }

  const localArgs = buildRunCommand(body);
  return {
    invocation: [process.execPath, ...localArgs],
    result: spawnSync(process.execPath, localArgs, {
      cwd: repoRoot,
      encoding: "utf8"
    })
  };
}

function createIdeaArtifactFile({ body, repoRoot, runArtifactDir, runId }) {
  if (typeof body.idea !== "string" || !body.idea.trim()) {
    return null;
  }

  const artifactPath = path.join(runArtifactDir, `${runId}.idea.md`);
  const artifactMarkdown = buildIdeaArtifactMarkdown(body.idea);
  fs.writeFileSync(artifactPath, `${artifactMarkdown}\n`, "utf8");
  return path.relative(repoRoot, artifactPath);
}

function runAgentStudioCommand({ body, repoRoot }) {
  const startedAt = new Date().toISOString();
  const id = createRunId();
  const logId = `${id}.log`;
  const runArtifactDir = getRunArtifactDirectoryForProject(body.project || "");
  const metadataPath = path.join(runArtifactDir, `${id}.json`);
  const logPath = path.join(runArtifactDir, logId);
  const executionBody = { ...body };
  const generatedIdeaArtifactPath = createIdeaArtifactFile({
    body: executionBody,
    repoRoot,
    runArtifactDir,
    runId: id
  });

  if (generatedIdeaArtifactPath && !executionBody.withArtifact) {
    executionBody.withArtifact = generatedIdeaArtifactPath;
  }

  const { invocation, result } = executeRunProcess({
    body: executionBody,
    repoRoot
  });
  const completedAt = new Date().toISOString();
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  let exitCode = typeof result.status === "number" ? result.status : 1;
  let status = exitCode === 0 ? "completed" : "failed";
  let writeArtifactMetadata = null;

  try {
    writeArtifactMetadata = maybeApplyDevWriteArtifact({
      body,
      repoRoot,
      stdout
    });
  } catch (error) {
    status = "failed";
    exitCode = exitCode === 0 ? 1 : exitCode;
    writeArtifactMetadata = {
      detected: true,
      applied: false,
      error: error.message
    };
  }

  const logSections = [
    `command: ${invocation.join(" ")}`,
    `startedAt: ${startedAt}`,
    `completedAt: ${completedAt}`,
    `exitCode: ${exitCode}`,
    "",
    "stdout:",
    stdout,
    "",
    "stderr:",
    stderr
  ];

  if (writeArtifactMetadata) {
    logSections.push("");
    logSections.push("writeArtifact:");
    logSections.push(JSON.stringify(writeArtifactMetadata, null, 2));
  }

  const logOutput = logSections.join("\n");

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

  if (typeof body.task === "string" && body.task.trim()) {
    metadata.task = body.task.trim();
  }

  if (typeof body.project === "string" && body.project.trim()) {
    metadata.project = normalizeProjectId(body.project);
  }

  if (writeArtifactMetadata) {
    metadata.writeArtifact = writeArtifactMetadata;
  }

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  if (typeof body.project === "string" && body.project.trim()) {
    generateProjectReadme({
      repoRoot,
      projectId: body.project
    });
  }

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

function listProjectHistory(projectId) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const runArtifactDir = getRunArtifactDirectoryForProject(normalizedProjectId);

  if (!fs.existsSync(runArtifactDir)) {
    return [];
  }

  const entries = fs.readdirSync(runArtifactDir, { withFileTypes: true });
  const historyItems = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const absolutePath = path.join(runArtifactDir, entry.name);

    try {
      const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
      const startedAtMs = Date.parse(parsed.startedAt || parsed.completedAt || 0);
      const completedAtMs = Date.parse(parsed.completedAt || parsed.startedAt || 0);

      historyItems.push({
        id: parsed.id || path.basename(entry.name, ".json"),
        agent: parsed.agent || "unknown",
        status: parsed.status || "unknown",
        startedAt: parsed.startedAt || null,
        completedAt: parsed.completedAt || null,
        logId: parsed.logId || null,
        task: parsed.task || null,
        contextPack: parsed.contextPack || null,
        project: parsed.project || normalizedProjectId,
        _sortKey:
          Number.isFinite(startedAtMs) && startedAtMs > 0
            ? startedAtMs
            : Number.isFinite(completedAtMs) && completedAtMs > 0
              ? completedAtMs
              : fs.statSync(absolutePath).mtimeMs
      });
    } catch (error) {
      continue;
    }
  }

  return historyItems
    .sort((left, right) => right._sortKey - left._sortKey)
    .map(({ _sortKey, ...item }) => item);
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

function getProjectRoot(projectId) {
  return path.join(PROJECTS_DIR_PATH, normalizeProjectId(projectId));
}

function assertSafeProjectRelativePath(requestedPath) {
  if (typeof requestedPath !== "string" || !requestedPath.trim()) {
    const error = new Error("Project file path must be a non-empty relative path.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedPath = requestedPath.trim();

  if (path.isAbsolute(normalizedPath)) {
    const error = new Error(`Absolute project file paths are not allowed: ${normalizedPath}`);
    error.statusCode = 400;
    throw error;
  }

  const segments = normalizedPath.split(/[\\/]+/).filter(Boolean);

  if (segments.includes("..")) {
    const error = new Error(`Parent-directory traversal is not allowed for project files: ${normalizedPath}`);
    error.statusCode = 400;
    throw error;
  }

  for (const segment of segments) {
    if (segment.startsWith(".") || HIDDEN_PROJECT_SEGMENTS.has(segment)) {
      const error = new Error(`Hidden project paths are not allowed: ${normalizedPath}`);
      error.statusCode = 400;
      throw error;
    }
  }

  return normalizedPath;
}

function resolveSafeProjectFilePath(projectId, requestedPath) {
  const projectRoot = getProjectRoot(projectId);
  const relativeProjectPath = assertSafeProjectRelativePath(requestedPath);
  const resolvedPath = path.resolve(projectRoot, relativeProjectPath);
  const relativeToProject = path.relative(projectRoot, resolvedPath);

  if (
    !relativeToProject ||
    relativeToProject.startsWith("..") ||
    path.isAbsolute(relativeToProject)
  ) {
    const error = new Error(`Resolved project file path is outside the selected project: ${requestedPath}`);
    error.statusCode = 400;
    throw error;
  }

  return {
    projectRoot,
    resolvedPath,
    relativeProjectPath,
    repoRelativePath: path.relative(path.resolve(__dirname, ".."), resolvedPath)
  };
}

function isVisibleProjectEntry(entryName) {
  return !entryName.startsWith(".") && !HIDDEN_PROJECT_SEGMENTS.has(entryName);
}

function listProjectFiles(projectId) {
  const projectRoot = getProjectRoot(projectId);
  const normalizedProjectId = normalizeProjectId(projectId);

  if (!fs.existsSync(projectRoot)) {
    return [];
  }

  const files = [];

  function walkDirectory(currentPath, relativePrefix = "") {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!isVisibleProjectEntry(entry.name)) {
        continue;
      }

      const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walkDirectory(absolutePath, relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      files.push({
        name: entry.name,
        path: `projects/${normalizedProjectId}/${relativePath}`,
        relativePath,
        isHtml: entry.name.toLowerCase().endsWith(".html")
      });
    }
  }

  walkDirectory(projectRoot);

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

function getPreferredProjectPreviewFile(files) {
  return (
    files.find((file) => file.isHtml && file.relativePath === "app/index.html") ||
    files.find((file) => file.isHtml && file.relativePath === "app/preview.html") ||
    files.find((file) => file.isHtml) ||
    null
  );
}

function formatProjectDisplayName(projectId) {
  return normalizeProjectId(projectId)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function escapeMarkdownInline(value) {
  return String(value || "").replace(/`/g, "\\`");
}

function extractHtmlTitle(html) {
  if (typeof html !== "string" || !html.trim()) {
    return "";
  }

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  const headingMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!headingMatch) {
    return "";
  }

  return headingMatch[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildProjectPreviewUrl(projectId, relativePath, port = DEFAULT_PORT) {
  return `http://127.0.0.1:${port}/project-file?project=${encodeURIComponent(
    normalizeProjectId(projectId)
  )}&path=${encodeURIComponent(relativePath)}`;
}

function buildProjectReadmeMarkdown({ projectId, projectFiles, projectHistory }) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const displayName = formatProjectDisplayName(normalizedProjectId);
  const previewFile = getPreferredProjectPreviewFile(projectFiles);
  const previewRelativePath = previewFile ? previewFile.relativePath : "";
  const previewProjectPath = previewFile ? previewFile.path : "Not available yet";
  const previewUrl = previewFile
    ? buildProjectPreviewUrl(normalizedProjectId, previewRelativePath)
    : "";
  const generatedAppFiles = projectFiles.filter(
    (file) => file.relativePath.startsWith("app/") && file.relativePath !== "README.md"
  );
  const recentRuns = projectHistory.slice(0, 5);

  let prototypeSummary =
    `This project contains a local-first Agent Studio prototype for ${displayName}.`;

  if (previewFile) {
    try {
      const previewContent = fs.readFileSync(
        resolveSafeProjectFilePath(normalizedProjectId, previewRelativePath).resolvedPath,
        "utf8"
      );
      const previewTitle = extractHtmlTitle(previewContent);

      if (previewTitle) {
        prototypeSummary = `This project contains a local-first Agent Studio prototype for ${previewTitle}.`;
      }

      if (generatedAppFiles.some((file) => file.relativePath === "app/script.js")) {
        prototypeSummary +=
          " The current app includes editable inputs and live preview behavior driven by in-project JavaScript.";
      }
    } catch (error) {
      // Keep the generic summary when preview parsing is unavailable.
    }
  }

  const lines = [
    `# ${displayName}`,
    "",
    "## Project Name",
    "",
    `- \`${normalizedProjectId}\``,
    "",
    "## What The Prototype Does",
    "",
    `- ${prototypeSummary}`,
    `- Generated project files are kept under \`projects/${normalizedProjectId}/\` and can be previewed through the local Agent Studio API.`,
    "",
    "## Main Preview File",
    "",
    `- \`${escapeMarkdownInline(previewProjectPath)}\``
  ];

  if (previewUrl) {
    lines.push(`- Preview URL: \`${escapeMarkdownInline(previewUrl)}\``);
  } else {
    lines.push("- Preview URL: no HTML preview file has been generated yet.");
  }

  lines.push("", "## Generated Files", "");

  if (generatedAppFiles.length === 0) {
    lines.push("- No generated app files detected yet.");
  } else {
    generatedAppFiles.forEach((file) => {
      lines.push(`- \`${escapeMarkdownInline(file.path)}\``);
    });
  }

  lines.push("", "## How To Open Preview Through Agent Studio", "");

  if (previewUrl) {
    lines.push("- Start the host API with `node server/agent-service.js`.");
    lines.push(`- Open \`${escapeMarkdownInline(previewUrl)}\` in your browser.`);
    lines.push(
      `- If you use a different port, keep the same route path and replace only the port: \`/project-file?project=${escapeMarkdownInline(
        normalizedProjectId
      )}&path=${encodeURIComponent(previewRelativePath)}\`.`
    );
  } else {
    lines.push("- Generate an HTML preview file first, then reopen this README for the preview route.");
  }

  lines.push("", "## Current Limitations", "");
  lines.push("- Local-first static prototype only; no deployment pipeline is configured.");
  lines.push("- No backend persistence, authentication, database, or background jobs.");
  lines.push("- Project history is file-based and scoped to local run artifacts.");

  lines.push("", "## Next Suggested Improvements", "");
  lines.push("- Add richer templates, sections, or component variations to the generated landing page.");
  lines.push("- Persist form inputs or sample content presets for easier iteration.");
  lines.push("- Expand the preview into a fuller multi-screen prototype or export flow when needed.");

  lines.push("", "## Recent Project Activity", "");

  if (recentRuns.length === 0) {
    lines.push("- No project-scoped runs recorded yet.");
  } else {
    recentRuns.forEach((run) => {
      const summaryParts = [
        `agent=\`${escapeMarkdownInline(run.agent || "unknown")}\``,
        `status=\`${escapeMarkdownInline(run.status || "unknown")}\``
      ];

      if (run.logId) {
        summaryParts.push(`log=\`${escapeMarkdownInline(run.logId)}\``);
      }

      if (run.task) {
        summaryParts.push(`task=\`${escapeMarkdownInline(run.task)}\``);
      }

      if (run.completedAt) {
        summaryParts.push(`completed=\`${escapeMarkdownInline(run.completedAt)}\``);
      } else if (run.startedAt) {
        summaryParts.push(`started=\`${escapeMarkdownInline(run.startedAt)}\``);
      }

      lines.push(`- ${summaryParts.join(" · ")}`);
    });
  }

  return `${lines.join("\n")}\n`;
}

function generateProjectReadme({ repoRoot, projectId }) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const projectRoot = getProjectRoot(normalizedProjectId);

  fs.mkdirSync(projectRoot, { recursive: true });

  const markdown = buildProjectReadmeMarkdown({
    projectId: normalizedProjectId,
    projectFiles: listProjectFiles(normalizedProjectId),
    projectHistory: listProjectHistory(normalizedProjectId)
  });

  const readmePath = path.join(projectRoot, "README.md");
  fs.writeFileSync(readmePath, markdown, "utf8");

  return {
    project: normalizedProjectId,
    path: path.relative(repoRoot, readmePath)
  };
}

function getProjectFileContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".md":
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function getProjectReadmePath(projectId) {
  return path.join(getProjectRoot(projectId), "README.md");
}

function readProjectReadme(projectId, repoRoot) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const readmePath = getProjectReadmePath(normalizedProjectId);

  if (!fs.existsSync(readmePath)) {
    const error = new Error(`Project README not found for: ${normalizedProjectId}`);
    error.statusCode = 404;
    throw error;
  }

  return {
    project: normalizedProjectId,
    path: path.relative(repoRoot, readmePath),
    content: fs.readFileSync(readmePath, "utf8")
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

  const writeArtifactLines =
    draftSections.get("Write Artifact") || draftSections.get("Write Artifact JSON") || null;

  const output = [`# Task: ${normalizedTitle}`, ""];

  for (const [sectionName, lines] of sectionContent.entries()) {
    output.push(`## ${sectionName}`, "");
    output.push(...lines);
    output.push("");
  }

  if (writeArtifactLines && trimSectionLines([...writeArtifactLines]).length > 0) {
    output.push("## Write Artifact", "");
    output.push(...writeArtifactLines);
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

  if (typeof body.project === "string" && body.project.trim()) {
    generateProjectReadme({
      repoRoot: path.resolve(__dirname, ".."),
      projectId: body.project
    });
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

function extractRunResultPayload(stdout) {
  if (typeof stdout !== "string" || !stdout.trim()) {
    return null;
  }

  const lines = stdout.split(/\r?\n/);
  const jsonStartIndex = lines.findIndex((line) => line.trim().startsWith("{"));

  if (jsonStartIndex === -1) {
    return null;
  }

  const jsonText = lines.slice(jsonStartIndex).join("\n").trim();

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return null;
  }
}

function loadWriteArtifactFromRunPayload({ repoRoot, runPayload }) {
  const writeArtifactPath = runPayload?.executed_agent?.write_artifact;

  if (typeof writeArtifactPath !== "string" || !writeArtifactPath.trim()) {
    return null;
  }

  const absolutePath = path.resolve(repoRoot, writeArtifactPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Structured write artifact not found: ${writeArtifactPath}`);
  }

  let artifact;
  try {
    artifact = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`Structured write artifact JSON is invalid: ${error.message}`);
  }

  validateStructuredWriteArtifactShape(artifact);

  return {
    relativePath: path.relative(repoRoot, absolutePath),
    artifact
  };
}

function validateAndResolveArtifactWrites({ repoRoot, projectId, artifact }) {
  const seenTargets = new Set();

  return artifact.writes.map((write, index) => {
    const resolvedTarget = resolveSafeProjectWritePath({
      repoRoot,
      projectId,
      requestedPath: write.path
    });

    if (seenTargets.has(resolvedTarget.relativePath)) {
      throw new Error(`Structured write artifact entry ${index + 1} targets the same file more than once: ${write.path}`);
    }

    seenTargets.add(resolvedTarget.relativePath);

    return {
      ...resolvedTarget,
      content: write.content
    };
  });
}

function applyProjectWriteArtifact({ repoRoot, projectId, artifact }) {
  const resolvedWrites = validateAndResolveArtifactWrites({
    repoRoot,
    projectId,
    artifact
  });

  for (const write of resolvedWrites) {
    fs.mkdirSync(path.dirname(write.resolvedPath), { recursive: true });
    fs.writeFileSync(write.resolvedPath, write.content, "utf8");
  }

  return resolvedWrites.map((write) => write.relativePath);
}

function maybeApplyDevWriteArtifact({ body, repoRoot, stdout }) {
  if (body.agent.trim() !== "dev") {
    return null;
  }

  if (typeof body.project !== "string" || !body.project.trim()) {
    return null;
  }

  const runPayload = extractRunResultPayload(stdout);

  if (!runPayload) {
    return null;
  }

  const loadedArtifact = loadWriteArtifactFromRunPayload({
    repoRoot,
    runPayload
  });

  if (!loadedArtifact) {
    return null;
  }

  const normalizedProjectId = normalizeProjectId(body.project);
  const appliedFiles = applyProjectWriteArtifact({
    repoRoot,
    projectId: normalizedProjectId,
    artifact: loadedArtifact.artifact
  });

  return {
    detected: true,
    applied: true,
    artifact: loadedArtifact.relativePath,
    files: appliedFiles
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
        routes: [
          "/",
          "/ui",
          "/health",
          "/agents",
          "/tasks",
          "/project-readme",
          "/project-history",
          "/project-files",
          "/project-file",
          "/runs/:id",
          "/logs/:id"
        ]
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

    if (method === "GET" && url.pathname === "/project-files") {
      const projectId = url.searchParams.get("project") || "";

      if (!projectId.trim()) {
        sendJson(response, 400, {
          error: "Project id is required for project file listing."
        });
        return;
      }

      try {
        sendJson(response, 200, {
          project: normalizeProjectId(projectId),
          files: listProjectFiles(projectId)
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname === "/project-readme") {
      const projectId = url.searchParams.get("project") || "";

      if (!projectId.trim()) {
        sendJson(response, 400, {
          error: "Project id is required for project README."
        });
        return;
      }

      try {
        sendJson(response, 200, readProjectReadme(projectId, repoRoot));
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname === "/project-history") {
      const projectId = url.searchParams.get("project") || "";

      if (!projectId.trim()) {
        sendJson(response, 400, {
          error: "Project id is required for project history."
        });
        return;
      }

      try {
        sendJson(response, 200, {
          project: normalizeProjectId(projectId),
          runs: listProjectHistory(projectId)
        });
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: error.message
        });
      }
      return;
    }

    if (method === "GET" && url.pathname === "/project-file") {
      const projectId = url.searchParams.get("project") || "";
      const requestedPath = url.searchParams.get("path") || "";

      if (!projectId.trim()) {
        sendJson(response, 400, {
          error: "Project id is required for project file access."
        });
        return;
      }

      if (!requestedPath.trim()) {
        sendJson(response, 400, {
          error: "Project file path is required."
        });
        return;
      }

      try {
        const resolvedFile = resolveSafeProjectFilePath(projectId, requestedPath);

        if (!fs.existsSync(resolvedFile.resolvedPath)) {
          sendJson(response, 404, {
            error: `Project file not found: ${requestedPath}`
          });
          return;
        }

        const stats = fs.statSync(resolvedFile.resolvedPath);

        if (!stats.isFile()) {
          sendJson(response, 400, {
            error: `Only project files can be served: ${requestedPath}`
          });
          return;
        }

        response.writeHead(200, {
          "Content-Type": getProjectFileContentType(resolvedFile.resolvedPath)
        });
        response.end(fs.readFileSync(resolvedFile.resolvedPath));
      } catch (error) {
        sendJson(response, error.statusCode || 400, {
          error: error.message
        });
      }
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
  PROJECT_RUNNER_HOST_REQUIRED_ERROR,
  RUN_ARTIFACT_DIR,
  SUPPORTED_AGENTS,
  buildRunCommand,
  buildRunAgentArguments,
  createAgentServiceServer,
  executeRunProcess,
  generateProjectReadme,
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
