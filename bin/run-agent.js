#!/usr/bin/env node

const path = require("path");
const { runAgent } = require("../src/agent-runner");
const { runTaskQueueCommand } = require("../src/task-queue");
const { runTaskFileCommand } = require("../src/task-file");
const { runToolAuditCommand } = require("../src/tool-audit");
const { runToolRouter } = require("../src/tool-router");

function printUsage() {
  console.log(
    "Usage: run-agent <context-pack-file> [--execute] [--llm] [--agent <agent-name>] [--task <task-file>] [--with-artifact <file-path>] [--chain 2|3|4] [--qa]"
  );
  console.log("       run-agent audit list");
  console.log("       run-agent queue <list|start|complete|validate> [task-id]");
  console.log("       run-agent task validate <task-file>");
}

function getFlagValue(flagName) {
  const index = process.argv.indexOf(flagName);

  if (index === -1) {
    return null;
  }

  const value = process.argv[index + 1];

  if (!value || value.startsWith("--")) {
    console.error(`run-agent failed: ${flagName} requires a value.`);
    process.exit(1);
  }

  return value;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const firstArg = process.argv[2];

  if (firstArg === "queue") {
    const action = process.argv[3];
    const taskId = process.argv[4];

    if (!action) {
      printUsage();
      process.exit(1);
    }

    try {
      const result =
        action === "validate"
          ? runToolRouter({
              repoRoot,
              role: "CLI",
              tool: "validate_queue"
            })
          : runTaskQueueCommand({
              repoRoot,
              action,
              taskId
            });
      console.log(result.message);
      process.exit(result.valid === false ? 1 : 0);
    } catch (error) {
      console.error(`run-agent failed: ${error.message}`);
      process.exit(1);
    }
  }

  if (firstArg === "audit") {
    const action = process.argv[3];

    if (!action) {
      printUsage();
      process.exit(1);
    }

    try {
      const result = runToolAuditCommand({
        repoRoot,
        action
      });
      console.log(result.message);
      process.exit(result.valid === false ? 1 : 0);
    } catch (error) {
      console.error(`run-agent failed: ${error.message}`);
      process.exit(1);
    }
  }

  if (firstArg === "task") {
    const action = process.argv[3];
    const taskPathArg = process.argv[4];

    if (!action) {
      printUsage();
      process.exit(1);
    }

    try {
      const result =
        action === "validate"
          ? runToolRouter({
              repoRoot,
              role: "CLI",
              tool: "validate_task_file",
              args: { taskPath: taskPathArg }
            })
          : runTaskFileCommand({
              action,
              taskPath: taskPathArg
            });
      console.log(result.message);
      process.exit(result.valid === false ? 1 : 0);
    } catch (error) {
      console.error(`run-agent failed: ${error.message}`);
      process.exit(1);
    }
  }

  const contextPackArg = process.argv[2];
  const shouldExecute = process.argv.includes("--execute");
  const useLlm = process.argv.includes("--llm");
  const directAgent = getFlagValue("--agent");
  const taskPath = getFlagValue("--task");
  const artifactPath = getFlagValue("--with-artifact");
  const chainSteps = getFlagValue("--chain");
  const useQaBranch = process.argv.includes("--qa");

  if (!contextPackArg || contextPackArg === "--help" || contextPackArg === "-h") {
    printUsage();
    process.exit(contextPackArg ? 0 : 1);
  }

  if (useLlm && !shouldExecute && !directAgent) {
    console.error("run-agent failed: --llm requires --execute.");
    process.exit(1);
  }

  if (chainSteps && directAgent) {
    console.error("run-agent failed: --chain cannot be used with --agent.");
    process.exit(1);
  }

  if (directAgent && directAgent.trim().toLowerCase() === "dev" && !taskPath) {
    console.warn("run-agent warning: --agent dev should be used with --task <task-file> so Dev receives exactly one selected task.");
  }

  const contextPackPath = path.resolve(process.cwd(), contextPackArg);

  try {
    const result = await runAgent({
      repoRoot,
      contextPackPath,
      shouldExecute,
      useLlm,
      directAgent,
      taskPath,
      artifactPath,
      chainSteps,
      useQaBranch
    });

    const chainStepSummaries = result.chain ? result.chain.step_summaries || [] : [];
    if (chainStepSummaries.length > 0) {
      for (const stepSummary of chainStepSummaries) {
        const warningCount = stepSummary.critical_warnings.length;
        console.log(
          `${stepSummary.agent} Quality: ${stepSummary.quality_status.toUpperCase()} - ${stepSummary.quality_summary}${
            warningCount ? ` Critical Warnings: ${warningCount}.` : ""
          }`
        );
      }
    } else {
      const qualityCheck = result.executed_agent ? result.executed_agent.quality_check : null;
      if (qualityCheck) {
        const warningCount = qualityCheck.warnings.length;
        console.log(
          `Quality: ${qualityCheck.status.toUpperCase()} - ${qualityCheck.summary}${
            warningCount ? ` Warnings: ${warningCount}.` : ""
          }`
        );
      }
    }

    if (result.chain) {
      console.log(
        `Chain: ${result.chain.status} - completed ${result.chain.completed_steps}/${result.chain.requested_steps} steps.`
      );
      if (result.chain.stop_reason) {
        console.log(`Chain Warning: ${result.chain.stop_reason}`);
      }
    }

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`run-agent failed: ${error.message}`);
    process.exit(1);
  }
}

main();
