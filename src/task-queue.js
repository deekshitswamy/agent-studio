const fs = require("fs");
const path = require("path");

const ALLOWED_STATUSES = ["pending", "in-progress", "done"];

function getTasksFilePath(repoRoot) {
  return path.join(repoRoot, "tasks.json");
}

function parseTasksState(tasksFilePath) {
  if (!fs.existsSync(tasksFilePath)) {
    throw new Error(`Task queue file not found: ${tasksFilePath}`);
  }

  let parsed;

  try {
    parsed = JSON.parse(fs.readFileSync(tasksFilePath, "utf8"));
  } catch (error) {
    throw new Error(`Task queue file is invalid JSON: ${tasksFilePath}`);
  }

  return parsed;
}

function validateTasksState(tasksState, tasksFilePath, repoRoot) {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();

  if (!tasksState || typeof tasksState !== "object" || Array.isArray(tasksState)) {
    errors.push(`Task queue file must contain a root object: ${tasksFilePath}`);
    return { errors, warnings };
  }

  if (!Array.isArray(tasksState.tasks)) {
    errors.push(`Task queue file must contain a root "tasks" array: ${tasksFilePath}`);
    return { errors, warnings };
  }

  for (const task of tasksState.tasks) {
    if (!task || typeof task !== "object") {
      errors.push(`Task queue contains an invalid task record: ${tasksFilePath}`);
      continue;
    }

    if (typeof task.id !== "string" || !task.id.trim()) {
      errors.push(`Task queue contains a task with missing "id": ${tasksFilePath}`);
    } else if (seenIds.has(task.id)) {
      errors.push(`Task queue contains duplicate task id: ${task.id}`);
    } else {
      seenIds.add(task.id);
    }

    if (typeof task.file !== "string" || !task.file.trim()) {
      errors.push(`Task queue contains a task with missing "file": ${tasksFilePath}`);
    } else {
      const taskFilePath = path.join(repoRoot, task.file);
      if (!fs.existsSync(taskFilePath)) {
        errors.push(`Task queue references a missing task file: ${task.file}`);
      }
    }

    if (!ALLOWED_STATUSES.includes(task.status)) {
      errors.push(`Task queue contains a task with invalid status "${task.status}": ${tasksFilePath}`);
    }
  }

  if (tasksState.tasks.length === 0) {
    warnings.push("Task queue contains no tasks.");
  }

  return { errors, warnings };
}

function readTasksState(tasksFilePath, repoRoot) {
  const parsed = parseTasksState(tasksFilePath);
  const validation = validateTasksState(parsed, tasksFilePath, repoRoot);

  if (validation.errors.length > 0) {
    throw new Error(validation.errors[0]);
  }

  return parsed;
}

function saveTasksState(tasksFilePath, tasksState) {
  fs.writeFileSync(tasksFilePath, `${JSON.stringify(tasksState, null, 2)}\n`, "utf8");
}

function findTaskById(tasksState, taskId) {
  const matches = tasksState.tasks.filter((task) => task.id === taskId);

  if (matches.length === 0) {
    throw new Error(`Unknown task id: ${taskId}`);
  }

  if (matches.length > 1) {
    throw new Error(`Task id is not unique: ${taskId}`);
  }

  return matches[0];
}

function listTasks(tasksState) {
  if (tasksState.tasks.length === 0) {
    return "No tasks found.";
  }

  return tasksState.tasks.map((task) => `${task.id}\t${task.status}\t${task.file}`).join("\n");
}

function updateTaskStatus(tasksState, taskId, status) {
  const task = findTaskById(tasksState, taskId);
  task.status = status;
  return task;
}

function formatValidationReport({ tasksFilePath, tasksState, validation }) {
  const lines = [];
  lines.push(`Task queue file: ${tasksFilePath}`);
  lines.push(`Tasks found: ${Array.isArray(tasksState.tasks) ? tasksState.tasks.length : 0}`);

  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    lines.push("Validation: PASS");
    lines.push("No validation errors or warnings.");
    return lines.join("\n");
  }

  lines.push(validation.errors.length === 0 ? "Validation: WARN" : "Validation: FAIL");

  if (validation.errors.length > 0) {
    lines.push("Errors:");
    for (const error of validation.errors) {
      lines.push(`- ${error}`);
    }
  }

  if (validation.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of validation.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join("\n");
}

function runTaskQueueCommand({ repoRoot, action, taskId }) {
  const tasksFilePath = getTasksFilePath(repoRoot);
  const tasksState = parseTasksState(tasksFilePath);

  if (action === "validate") {
    const validation = validateTasksState(tasksState, tasksFilePath, repoRoot);
    return {
      message: formatValidationReport({
        tasksFilePath,
        tasksState,
        validation
      }),
      changed: false,
      valid: validation.errors.length === 0
    };
  }

  const validatedTasksState = readTasksState(tasksFilePath, repoRoot);

  if (action === "list") {
    return {
      message: listTasks(validatedTasksState),
      changed: false
    };
  }

  if (!taskId) {
    throw new Error(`queue ${action} requires <task-id>.`);
  }

  if (action === "start") {
    const task = updateTaskStatus(validatedTasksState, taskId, "in-progress");
    saveTasksState(tasksFilePath, validatedTasksState);
    return {
      message: `Task started: ${task.id} -> in-progress`,
      changed: true
    };
  }

  if (action === "complete") {
    const task = updateTaskStatus(validatedTasksState, taskId, "done");
    saveTasksState(tasksFilePath, validatedTasksState);
    return {
      message: `Task completed: ${task.id} -> done`,
      changed: true
    };
  }

  throw new Error(`Unsupported queue action: ${action}`);
}

module.exports = {
  formatValidationReport,
  getTasksFilePath,
  listTasks,
  parseTasksState,
  readTasksState,
  runTaskQueueCommand,
  validateTasksState
};
