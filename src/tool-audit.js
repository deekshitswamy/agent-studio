const fs = require("fs");
const { getAuditLogPath } = require("./tool-router");

const DEFAULT_RECENT_ENTRY_COUNT = 20;

function readAuditLines(auditLogPath) {
  if (!fs.existsSync(auditLogPath)) {
    throw new Error(`Tool audit log file not found: ${auditLogPath}`);
  }

  return fs
    .readFileSync(auditLogPath, "utf8")
    .split(/\r?\n/)
    .map((line, index) => ({
      line,
      lineNumber: index + 1
    }))
    .filter(({ line }) => line.trim().length > 0);
}

function parseAuditEntries(lines) {
  const entries = [];
  const warnings = [];

  for (const { line, lineNumber } of lines) {
    try {
      const parsed = JSON.parse(line);
      entries.push(parsed);
    } catch (error) {
      warnings.push(`Skipping invalid audit log line ${lineNumber}.`);
    }
  }

  return { entries, warnings };
}

function formatArgs(args) {
  const safeArgs = args && typeof args === "object" ? args : {};
  const parts = Object.entries(safeArgs).map(([key, value]) => `${key}=${value}`);
  return parts.length > 0 ? parts.join(", ") : "none";
}

function formatAuditListReport({ auditLogPath, entries, warnings }) {
  const lines = [];
  lines.push(`Tool audit log: ${auditLogPath}`);

  if (entries.length === 0) {
    lines.push("No valid audit entries found.");
  } else {
    lines.push(`Showing ${entries.length} recent audit entr${entries.length === 1 ? "y" : "ies"}:`);
    for (const entry of entries) {
      lines.push(
        `- ${entry.timestamp} | role=${entry.role} | tool=${entry.tool} | result=${entry.result} | args=${formatArgs(entry.args)}`
      );
      if (entry.error) {
        lines.push(`  error=${entry.error}`);
      }
    }
  }

  if (warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join("\n");
}

function listRecentAuditEntries({ repoRoot, limit = DEFAULT_RECENT_ENTRY_COUNT }) {
  const auditLogPath = getAuditLogPath(repoRoot);
  const lines = readAuditLines(auditLogPath);
  const recentLines = lines.slice(-limit);
  const { entries, warnings } = parseAuditEntries(recentLines);

  return {
    auditLogPath,
    entries,
    warnings
  };
}

function runToolAuditCommand({ repoRoot, action }) {
  if (action !== "list") {
    throw new Error(`Unsupported audit action: ${action}`);
  }

  const { auditLogPath, entries, warnings } = listRecentAuditEntries({
    repoRoot
  });

  return {
    message: formatAuditListReport({
      auditLogPath,
      entries,
      warnings
    }),
    changed: false,
    valid: true
  };
}

module.exports = {
  formatAuditListReport,
  listRecentAuditEntries,
  runToolAuditCommand
};
