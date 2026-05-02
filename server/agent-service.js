#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const SUPPORTED_AGENTS = Object.freeze(["pm", "architect", "task-planner", "dev", "qa"]);
const RUN_ARTIFACT_DIR = path.resolve(__dirname, "..", ".local", "runs");
const UI_INDEX_PATH = path.resolve(__dirname, "..", "ui", "index.html");

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
}

function createRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${timestamp}-${process.pid}`;
}

function ensureRunArtifactDir() {
  fs.mkdirSync(RUN_ARTIFACT_DIR, { recursive: true });
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
  const metadataPath = path.join(RUN_ARTIFACT_DIR, `${id}.json`);
  const logPath = path.join(RUN_ARTIFACT_DIR, logId);
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

function getRunMetadataPath(runId) {
  return path.join(RUN_ARTIFACT_DIR, `${validateRunArtifactId(runId)}.json`);
}

function getRunLogPath(runId) {
  return path.join(RUN_ARTIFACT_DIR, `${validateRunArtifactId(runId)}.log`);
}

function readRunMetadata(runId) {
  const metadataPath = getRunMetadataPath(runId);

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

function readRunLog(runId) {
  const logPath = getRunLogPath(runId);

  if (!fs.existsSync(logPath)) {
    const error = new Error(`Log not found: ${runId}`);
    error.statusCode = 404;
    throw error;
  }

  return fs.readFileSync(logPath, "utf8");
}

function readUiIndexHtml() {
  if (!fs.existsSync(UI_INDEX_PATH)) {
    const error = new Error("UI entry point not found.");
    error.statusCode = 404;
    throw error;
  }

  return fs.readFileSync(UI_INDEX_PATH, "utf8");
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
        routes: ["/", "/ui", "/health", "/agents", "/runs/:id", "/logs/:id"]
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

    if (method === "GET" && url.pathname.startsWith("/runs/")) {
      const runId = decodeURIComponent(url.pathname.slice("/runs/".length)).trim();

      if (!runId) {
        sendJson(response, 404, {
          error: "Not found."
        });
        return;
      }

      try {
        const metadata = readRunMetadata(runId);
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

      if (!runId) {
        sendJson(response, 404, {
          error: "Not found."
        });
        return;
      }

      try {
        const logContent = readRunLog(runId);
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

    if (method === "POST" && url.pathname === "/runs") {
      try {
        const body = await readJsonBody(request);
        validateRunRequest(body);
        ensureRunArtifactDir();

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
  readRunLog,
  readRunMetadata,
  runAgentStudioCommand,
  startAgentService
};
