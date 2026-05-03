const fs = require("fs");
const path = require("path");

const {
  formatTaskValidationReport,
  validateTaskFile
} = require("./task-file");
const {
  formatValidationReport,
  getTasksFilePath,
  parseTasksState,
  validateTasksState
} = require("./task-queue");

const TOOL_AUDIT_LOG_FILE = "tool-router-audit.jsonl";

const ROLE_TOOL_ALLOWLIST = {
  orchestrator: ["read_file", "validate_queue"],
  pm: ["read_file"],
  architect: ["read_file"],
  ux: ["read_file"],
  "ux-designer": ["read_file"],
  "task-planner": ["read_file", "validate_task_file"],
  dev: ["read_file", "validate_task_file"],
  qa: ["read_file", "validate_task_file", "validate_queue"],
  devops: ["read_file", "validate_task_file", "validate_queue"],
  cli: ["read_file", "validate_task_file", "validate_queue"]
};

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeTool(tool) {
  return String(tool || "").trim().toLowerCase();
}

function sanitizePathArg(repoRoot, targetPath) {
  if (!targetPath) {
    return null;
  }

  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(process.cwd(), targetPath);
  return path.relative(repoRoot, absolutePath);
}

function sanitizeArgs(repoRoot, toolName, args) {
  if (toolName === "read_file") {
    return {
      file_path: sanitizePathArg(repoRoot, args.filePath || args.path)
    };
  }

  if (toolName === "validate_task_file") {
    return {
      task_path: sanitizePathArg(repoRoot, args.taskPath || args.filePath || args.path)
    };
  }

  return {};
}

function getAuditLogPath(repoRoot) {
  return path.join(repoRoot, "logs", TOOL_AUDIT_LOG_FILE);
}

function appendAuditEntry(repoRoot, entry) {
  const auditLogPath = getAuditLogPath(repoRoot);
  fs.mkdirSync(path.dirname(auditLogPath), { recursive: true });
  fs.appendFileSync(auditLogPath, `${JSON.stringify(entry)}\n`, "utf8");
}

function recordAuditEntry({ repoRoot, auditTrail, entry }) {
  appendAuditEntry(repoRoot, entry);

  if (Array.isArray(auditTrail)) {
    auditTrail.push(entry);
  }
}

function resolveWorkspacePath(repoRoot, targetPath) {
  const absolutePath = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(process.cwd(), targetPath);
  const relativeToRepo = path.relative(repoRoot, absolutePath);

  if (relativeToRepo.startsWith("..") || path.isAbsolute(relativeToRepo)) {
    throw new Error(`Tool router path is outside the workspace: ${absolutePath}`);
  }

  return absolutePath;
}

function assertToolAllowed(roleKey, toolName) {
  const allowedTools = ROLE_TOOL_ALLOWLIST[roleKey];

  if (!allowedTools) {
    throw new Error(`Unknown role for tool router: ${roleKey}`);
  }

  if (!allowedTools.includes(toolName)) {
    throw new Error(`Tool "${toolName}" is not allowed for role "${roleKey}".`);
  }
}

function routeReadFile({ repoRoot, roleKey, args }) {
  const targetPath = args.filePath || args.path;

  if (!targetPath) {
    throw new Error('read_file requires "filePath".');
  }

  const filePath = resolveWorkspacePath(repoRoot, targetPath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return {
    role: roleKey,
    tool: "read_file",
    file_path: filePath,
    content: fs.readFileSync(filePath, "utf8")
  };
}

function routeValidateTaskFile({ repoRoot, roleKey, args }) {
  const targetPath = args.taskPath || args.filePath || args.path;

  if (!targetPath) {
    throw new Error('validate_task_file requires "taskPath".');
  }

  const taskFilePath = resolveWorkspacePath(repoRoot, targetPath);
  const validation = validateTaskFile(taskFilePath);

  return {
    role: roleKey,
    tool: "validate_task_file",
    valid: validation.valid,
    task_file_path: taskFilePath,
    validation,
    message: formatTaskValidationReport(validation)
  };
}

function routeValidateQueue({ repoRoot, roleKey }) {
  const tasksFilePath = getTasksFilePath(repoRoot);
  const tasksState = parseTasksState(tasksFilePath);
  const validation = validateTasksState(tasksState, tasksFilePath, repoRoot);

  return {
    role: roleKey,
    tool: "validate_queue",
    valid: validation.errors.length === 0,
    tasks_file_path: tasksFilePath,
    validation,
    message: formatValidationReport({
      tasksFilePath,
      tasksState,
      validation
    })
  };
}

function runToolRouter({ repoRoot, role, tool, args = {}, auditTrail = null }) {
  const roleKey = normalizeRole(role);
  const toolName = normalizeTool(tool);
  const safeArgs = sanitizeArgs(repoRoot, toolName, args);
  const timestamp = new Date().toISOString();

  try {
    if (!["read_file", "validate_task_file", "validate_queue"].includes(toolName)) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    assertToolAllowed(roleKey, toolName);

    let result;

    if (toolName === "read_file") {
      result = routeReadFile({ repoRoot, roleKey, args });
    } else if (toolName === "validate_task_file") {
      result = routeValidateTaskFile({ repoRoot, roleKey, args });
    } else {
      result = routeValidateQueue({ repoRoot, roleKey });
    }

    recordAuditEntry({
      repoRoot,
      auditTrail,
      entry: {
        timestamp,
        role: roleKey,
        tool: toolName,
        args: safeArgs,
        result: "success"
      }
    });

    return {
      ...result,
      audit_entry: {
        timestamp,
        role: roleKey,
        tool: toolName,
        args: safeArgs,
        result: "success"
      }
    };
  } catch (error) {
    recordAuditEntry({
      repoRoot,
      auditTrail,
      entry: {
        timestamp,
        role: roleKey,
        tool: toolName,
        args: safeArgs,
        result: "failure",
        error: error.message
      }
    });
    throw error;
  }
}

module.exports = {
  ROLE_TOOL_ALLOWLIST,
  getAuditLogPath,
  runToolRouter
};
