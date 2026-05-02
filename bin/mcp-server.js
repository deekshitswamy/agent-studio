#!/usr/bin/env node

const path = require("path");
const { startLocalMcpServer } = require("../src/mcp/server");

const repoRoot = path.resolve(__dirname, "..");
const exitCode = startLocalMcpServer({
  repoRoot,
  argv: process.argv.slice(2),
  stdout: process.stdout,
  stderr: process.stderr
});

process.exit(exitCode);
