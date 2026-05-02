const { getTaskFilePath, validateTaskFile } = require("../task-file");
const {
  getTasksFilePath,
  listTasks,
  readTasksState,
  validateTasksState
} = require("../task-queue");
const { listRecentAuditEntries } = require("../tool-audit");
const { resolveSafeReadPath } = require("./safe-paths");
const { runToolRouter } = require("../tool-router");

const READ_ONLY_TOOL_DEFINITIONS = Object.freeze([
  {
    name: "read_file",
    description: "Read a repo-local file through the MCP adapter boundary.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"],
      additionalProperties: false
    }
  },
  {
    name: "validate_task_file",
    description: "Validate a task file against the required task template sections.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"],
      additionalProperties: false
    }
  },
  {
    name: "validate_queue",
    description: "Validate the repo task queue state from tasks.json.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "list_queue",
    description: "List the current task queue state without mutating it.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  },
  {
    name: "audit_list",
    description: "Read recent tool-router audit entries from the local audit log.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
]);

function listRegisteredTools() {
  return READ_ONLY_TOOL_DEFINITIONS.map((tool) => ({
    ...tool,
    inputSchema: { ...tool.inputSchema }
  }));
}

function handleReadFile({ repoRoot, args, role = "cli", auditTrail = null }) {
  const safePath = resolveSafeReadPath({
    repoRoot,
    requestedPath: args.path
  });

  const result = runToolRouter({
    repoRoot,
    role,
    tool: "read_file",
    args: {
      filePath: safePath.resolvedPath
    },
    auditTrail
  });

  return {
    path: safePath.relativePath,
    content: result.content
  };
}

function handleValidateTaskFile({ repoRoot, args, role = "cli", auditTrail = null }) {
  runToolRouter({
    repoRoot,
    role,
    tool: "validate_task_file",
    args: {
      taskPath: args.path
    },
    auditTrail
  });

  const taskFilePath = getTaskFilePath(args.path);
  const validation = validateTaskFile(taskFilePath);

  return {
    taskFilePath: validation.taskFilePath,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings
  };
}

function handleValidateQueue({ repoRoot, role = "cli", auditTrail = null }) {
  const result = runToolRouter({
    repoRoot,
    role,
    tool: "validate_queue",
    auditTrail
  });

  return {
    tasksFilePath: result.tasks_file_path,
    valid: result.valid,
    errors: result.validation.errors,
    warnings: result.validation.warnings
  };
}

function handleListQueue({ repoRoot }) {
  const tasksFilePath = getTasksFilePath(repoRoot);
  const tasksState = readTasksState(tasksFilePath, repoRoot);

  return {
    tasksFilePath,
    tasks: tasksState.tasks.map((task) => ({
      id: task.id,
      file: task.file,
      status: task.status
    })),
    output: listTasks(tasksState)
  };
}

function handleAuditList({ repoRoot }) {
  const { auditLogPath, entries, warnings } = listRecentAuditEntries({
    repoRoot
  });

  return {
    auditLogPath,
    entries,
    warnings
  };
}

function createReadOnlyToolAdapters({ repoRoot, role = "cli", auditTrail = null }) {
  return {
    read_file: (args = {}) => handleReadFile({ repoRoot, args, role, auditTrail }),
    validate_task_file: (args = {}) => handleValidateTaskFile({ repoRoot, args, role, auditTrail }),
    validate_queue: () => handleValidateQueue({ repoRoot, role, auditTrail }),
    list_queue: () => handleListQueue({ repoRoot }),
    audit_list: () => handleAuditList({ repoRoot })
  };
}

module.exports = {
  createReadOnlyToolAdapters,
  handleAuditList,
  handleListQueue,
  handleReadFile,
  handleValidateQueue,
  handleValidateTaskFile,
  listRegisteredTools,
  READ_ONLY_TOOL_DEFINITIONS
};
