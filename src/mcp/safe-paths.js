const fs = require("fs");
const path = require("path");

const ALLOWED_HIDDEN_SEGMENTS = new Set([]);
const BLOCKED_FILE_NAMES = new Set([
  ".env",
  ".env.local",
  ".env.example",
  ".env.development",
  ".env.production",
  ".env.test"
]);

function normalizeRequestedPath(requestedPath) {
  if (typeof requestedPath !== "string" || !requestedPath.trim()) {
    throw new Error("read_file requires a non-empty repo-relative path.");
  }

  return requestedPath.trim();
}

function assertNotAbsolutePath(requestedPath) {
  if (path.isAbsolute(requestedPath)) {
    throw new Error(`Absolute paths are not allowed for MCP read_file: ${requestedPath}`);
  }
}

function assertNoParentTraversal(requestedPath) {
  const segments = requestedPath.split(/[\\/]+/).filter(Boolean);

  if (segments.includes("..")) {
    throw new Error(`Parent-directory traversal is not allowed for MCP read_file: ${requestedPath}`);
  }
}

function assertNoHiddenOrSensitiveSegments(requestedPath) {
  const segments = requestedPath.split(/[\\/]+/).filter(Boolean);

  for (const segment of segments) {
    if (BLOCKED_FILE_NAMES.has(segment)) {
      throw new Error(`Sensitive path is not allowed for MCP read_file: ${requestedPath}`);
    }

    if (segment.startsWith(".") && !ALLOWED_HIDDEN_SEGMENTS.has(segment)) {
      throw new Error(`Hidden paths are not allowed for MCP read_file: ${requestedPath}`);
    }
  }
}

function assertInsideRepo(repoRoot, resolvedPath, requestedPath) {
  const relativeToRepo = path.relative(repoRoot, resolvedPath);

  if (
    relativeToRepo === "" ||
    relativeToRepo.startsWith("..") ||
    path.isAbsolute(relativeToRepo)
  ) {
    throw new Error(`Resolved path is outside the repo root for MCP read_file: ${requestedPath}`);
  }
}

function assertFileOnly(resolvedPath, requestedPath) {
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found for MCP read_file: ${requestedPath}`);
  }

  const stats = fs.statSync(resolvedPath);

  if (!stats.isFile()) {
    throw new Error(`Only file reads are allowed for MCP read_file: ${requestedPath}`);
  }
}

function resolveSafeReadPath({ repoRoot, requestedPath }) {
  const normalizedPath = normalizeRequestedPath(requestedPath);

  assertNotAbsolutePath(normalizedPath);
  assertNoParentTraversal(normalizedPath);
  assertNoHiddenOrSensitiveSegments(normalizedPath);

  const resolvedPath = path.resolve(repoRoot, normalizedPath);

  assertInsideRepo(repoRoot, resolvedPath, normalizedPath);
  assertFileOnly(resolvedPath, normalizedPath);

  return {
    requestedPath: normalizedPath,
    resolvedPath,
    relativePath: path.relative(repoRoot, resolvedPath)
  };
}

module.exports = {
  ALLOWED_HIDDEN_SEGMENTS,
  BLOCKED_FILE_NAMES,
  resolveSafeReadPath
};
