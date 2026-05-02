const fs = require("fs");
const path = require("path");

const REQUIRED_SECTIONS = [
  "Task",
  "Status",
  "Objective",
  "Context Pack",
  "Scope",
  "Out of Scope",
  "Acceptance Criteria",
  "Verification",
  "Dev Handoff"
];

function getTaskFilePath(taskPath) {
  return path.resolve(process.cwd(), taskPath);
}

function readTaskFile(taskFilePath) {
  if (!fs.existsSync(taskFilePath)) {
    throw new Error(`Task file not found: ${taskFilePath}`);
  }

  return fs.readFileSync(taskFilePath, "utf8");
}

function parseTaskSections(markdown) {
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

function sectionHasContent(lines) {
  return lines.some((line) => line.trim().length > 0);
}

function validateTaskFile(taskFilePath) {
  const markdown = readTaskFile(taskFilePath);
  const sections = parseTaskSections(markdown);
  const errors = [];
  const warnings = [];

  for (const sectionName of REQUIRED_SECTIONS) {
    if (!sections.has(sectionName)) {
      errors.push(`Missing required section: ${sectionName}`);
      continue;
    }

    if (!sectionHasContent(sections.get(sectionName))) {
      errors.push(`Required section is empty: ${sectionName}`);
    }
  }

  return {
    taskFilePath,
    errors,
    warnings,
    valid: errors.length === 0
  };
}

function formatTaskValidationReport(result) {
  const lines = [];
  lines.push(`Task file: ${result.taskFilePath}`);

  if (result.valid && result.warnings.length === 0) {
    lines.push("Validation: PASS");
    lines.push("No validation errors or warnings.");
    return lines.join("\n");
  }

  lines.push(result.valid ? "Validation: WARN" : "Validation: FAIL");

  if (result.errors.length > 0) {
    lines.push("Errors:");
    for (const error of result.errors) {
      lines.push(`- ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join("\n");
}

function runTaskFileCommand({ action, taskPath }) {
  if (action !== "validate") {
    throw new Error(`Unsupported task action: ${action}`);
  }

  if (!taskPath) {
    throw new Error("task validate requires <task-file>.");
  }

  const taskFilePath = getTaskFilePath(taskPath);
  const validation = validateTaskFile(taskFilePath);

  return {
    message: formatTaskValidationReport(validation),
    changed: false,
    valid: validation.valid
  };
}

module.exports = {
  formatTaskValidationReport,
  getTaskFilePath,
  runTaskFileCommand,
  validateTaskFile
};
