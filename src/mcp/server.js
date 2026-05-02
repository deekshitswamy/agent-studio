const path = require("path");
const { createReadOnlyToolAdapters, listRegisteredTools } = require("./tools");

function createLocalMcpServer({ repoRoot }) {
  const resolvedRepoRoot = path.resolve(repoRoot);
  return {
    server: {
      name: "divya-agent-runner-local-mcp",
      version: "0.1.0",
      mode: "read-only-adapters",
      transport: "local-only",
      repoRoot: resolvedRepoRoot
    },
    tools: listRegisteredTools(),
    adapters: createReadOnlyToolAdapters({
      repoRoot: resolvedRepoRoot
    })
  };
}

function formatServerSummary(serverState) {
  const lines = [];
  lines.push("DIVYA Local MCP Server");
  lines.push(`Repo Root: ${serverState.server.repoRoot}`);
  lines.push(`Mode: ${serverState.server.mode}`);
  lines.push("Registered Read-Only Tools:");

  for (const tool of serverState.tools) {
    lines.push(`- ${tool.name}: ${tool.description}`);
  }

  return lines.join("\n");
}

function startLocalMcpServer({
  repoRoot,
  argv = [],
  stdout = process.stdout,
  stderr = process.stderr
}) {
  const serverState = createLocalMcpServer({
    repoRoot: path.resolve(repoRoot)
  });
  const printableServerState = {
    server: serverState.server,
    tools: serverState.tools
  };

  if (argv.includes("--json")) {
    stdout.write(`${JSON.stringify(printableServerState, null, 2)}\n`);
    return 0;
  }

  if (argv.includes("--print-tools")) {
    stdout.write(`${formatServerSummary(serverState)}\n`);
    return 0;
  }

  stderr.write("Local MCP server skeleton is ready. Use --print-tools or --json.\n");
  return 0;
}

module.exports = {
  createLocalMcpServer,
  formatServerSummary,
  startLocalMcpServer
};
