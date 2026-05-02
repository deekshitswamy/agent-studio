const path = require("path");
const { runToolRouter } = require("./tool-router");

function readScopedFile({ repoRoot, role, filePath, auditTrail }) {
  return runToolRouter({
    repoRoot,
    role,
    tool: "read_file",
    args: { filePath },
    auditTrail
  }).content;
}

function buildAgentContext({
  repoRoot,
  contextPackPath,
  taskPath = null,
  role = "orchestrator",
  auditTrail = null
}) {
  const agentsPath = path.join(repoRoot, "AGENTS.md");
  const workflowPath = path.join(repoRoot, "system", "agent-runner.md");
  const resolvedContextPackPath = path.resolve(contextPackPath);
  const resolvedTaskPath = taskPath ? path.resolve(taskPath) : null;

  const context = {
    contextPackPath: resolvedContextPackPath,
    contextPackMarkdown: readScopedFile({
      repoRoot,
      role,
      filePath: resolvedContextPackPath,
      auditTrail
    }),
    agentsPath,
    agentsMarkdown: readScopedFile({
      repoRoot,
      role,
      filePath: agentsPath,
      auditTrail
    }),
    workflowPath,
    workflowMarkdown: readScopedFile({
      repoRoot,
      role,
      filePath: workflowPath,
      auditTrail
    }),
    taskFilePath: resolvedTaskPath,
    taskMarkdown: resolvedTaskPath
      ? readScopedFile({
          repoRoot,
          role,
          filePath: resolvedTaskPath,
          auditTrail
        })
      : null
  };

  context.files = [
    path.relative(repoRoot, context.contextPackPath),
    path.relative(repoRoot, context.agentsPath),
    path.relative(repoRoot, context.workflowPath),
    ...(context.taskFilePath ? [path.relative(repoRoot, context.taskFilePath)] : [])
  ];

  return context;
}

module.exports = {
  buildAgentContext
};
