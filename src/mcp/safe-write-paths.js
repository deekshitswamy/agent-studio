const path = require("path");
const { BLOCKED_FILE_NAMES } = require("./safe-paths");

function normalizeRequestedPath(requestedPath) {
  if (typeof requestedPath !== "string" || !requestedPath.trim()) {
    throw new Error("write artifact paths must be non-empty repo-relative paths.");
  }

  return requestedPath.trim();
}

function assertNotAbsolutePath(requestedPath) {
  if (path.isAbsolute(requestedPath)) {
    throw new Error(`Absolute paths are not allowed for Dev write artifacts: ${requestedPath}`);
  }
}

function assertNoParentTraversal(requestedPath) {
  const segments = requestedPath.split(/[\\/]+/).filter(Boolean);

  if (segments.includes("..")) {
    throw new Error(`Parent-directory traversal is not allowed for Dev write artifacts: ${requestedPath}`);
  }
}

function assertNoHiddenOrSensitiveSegments(requestedPath) {
  const segments = requestedPath.split(/[\\/]+/).filter(Boolean);

  for (const segment of segments) {
    if (BLOCKED_FILE_NAMES.has(segment)) {
      throw new Error(`Sensitive path is not allowed for Dev write artifacts: ${requestedPath}`);
    }

    if (segment.startsWith(".")) {
      throw new Error(`Hidden paths are not allowed for Dev write artifacts: ${requestedPath}`);
    }
  }
}

function resolveSafeProjectWritePath({ repoRoot, projectId, requestedPath }) {
  if (typeof projectId !== "string" || !projectId.trim()) {
    throw new Error("Project id is required for Dev write artifacts.");
  }

  const normalizedPath = normalizeRequestedPath(requestedPath);
  const expectedPrefix = `projects/${projectId}/`;

  assertNotAbsolutePath(normalizedPath);
  assertNoParentTraversal(normalizedPath);
  assertNoHiddenOrSensitiveSegments(normalizedPath);

  if (!normalizedPath.startsWith(expectedPrefix)) {
    throw new Error(
      `Dev write artifact paths must stay under ${expectedPrefix}: ${requestedPath}`
    );
  }

  const resolvedPath = path.resolve(repoRoot, normalizedPath);
  const projectRoot = path.resolve(repoRoot, "projects", projectId);
  const relativeToProject = path.relative(projectRoot, resolvedPath);

  if (
    relativeToProject === "" ||
    relativeToProject.startsWith("..") ||
    path.isAbsolute(relativeToProject)
  ) {
    throw new Error(
      `Resolved Dev write artifact path is outside the selected project workspace: ${requestedPath}`
    );
  }

  return {
    requestedPath: normalizedPath,
    resolvedPath,
    relativePath: path.relative(repoRoot, resolvedPath),
    projectRoot
  };
}

module.exports = {
  resolveSafeProjectWritePath
};
