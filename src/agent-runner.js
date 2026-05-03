const fs = require("fs");
const path = require("path");
const { buildAgentContext } = require("./context-builder");
const { runToolRouter } = require("./tool-router");
const {
  extractStructuredWriteArtifact,
  validateStructuredWriteArtifactShape
} = require("./dev-write-artifacts");

const DEFAULT_LLM_MODEL = "gpt-5.5";

function readFile(repoRoot, role, filePath, auditTrail = null) {
  return runToolRouter({
    repoRoot,
    role,
    tool: "read_file",
    args: { filePath },
    auditTrail
  }).content;
}

function readOptionalFile(repoRoot, role, filePath, auditTrail = null) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readFile(repoRoot, role, filePath, auditTrail);
}

function parseSections(markdown) {
  const sections = {};
  let currentSection = "root";
  sections[currentSection] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.*)$/);

    if (match) {
      currentSection = match[1].trim().toLowerCase();
      sections[currentSection] = [];
      continue;
    }

    sections[currentSection].push(line);
  }

  return sections;
}

function collectListItems(lines) {
  return lines
    .map((line) => line.trim())
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);
}

function collectPlainText(lines) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("- "))
    .join(" ");
}

function getSection(sections, names) {
  for (const name of names) {
    const normalizedName = name.toLowerCase();
    if (sections[normalizedName]) {
      return sections[normalizedName];
    }
  }

  return [];
}

function parseRuleNames(agentsMarkdown) {
  return agentsMarkdown
    .split(/\r?\n/)
    .map((line) => line.match(/^###\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function parseWorkflowSteps(workflowMarkdown) {
  return workflowMarkdown
    .split(/\r?\n/)
    .map((line) => line.match(/^###\s+\d+\.\s+(.*)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function slugifyAgentName(agentName) {
  return agentName.trim().toLowerCase().replace(/\s+/g, "-");
}

function buildStateFilePath(repoRoot, contextPackPath) {
  const contextName = path.basename(contextPackPath, path.extname(contextPackPath));
  return path.join(repoRoot, "state", `${contextName}.md`);
}

function buildCurrentUnderstanding(contextPackPath, contextSections) {
  const goalLines = getSection(contextSections, ["Goal", "Objective"]);
  const scopeLines = getSection(contextSections, ["Scope", "In Scope"]);
  const featureLines = getSection(contextSections, ["Features (MVP)", "Features"]);
  const constraintLines = getSection(contextSections, ["Constraints"]);
  const nonGoalLines = getSection(contextSections, ["Non-goals", "Out of Scope"]);

  const goal = collectPlainText(goalLines) || "No explicit goal found in the context pack.";
  const scope = collectListItems(scopeLines);
  const features = collectListItems(featureLines);
  const constraints = collectListItems(constraintLines);
  const nonGoals = collectListItems(nonGoalLines);

  return {
    context_pack: path.relative(process.cwd(), contextPackPath),
    goal,
    scope,
    features,
    constraints,
    non_goals: nonGoals,
    summary:
      "This execution is focused on a single repo-local task defined by the context pack, with local file-based behavior only and no UI, API, or async workflow expansion."
  };
}

function buildScopeCheck(currentUnderstanding, ruleNames) {
  const issues = [];

  if (!currentUnderstanding.goal || currentUnderstanding.goal === "No explicit goal found in the context pack.") {
    issues.push("Missing explicit goal in context pack.");
  }

  if (!currentUnderstanding.scope.length) {
    issues.push("Missing explicit scope items in context pack.");
  }

  const disallowedTerms = ["ui", "api", "async", "automation"];
  const scopeText = currentUnderstanding.scope.join(" ").toLowerCase();
  const violations = disallowedTerms.filter((term) => scopeText.includes(term));
  for (const violation of violations) {
    issues.push(`Scope appears to include a non-goal term: ${violation}.`);
  }

  return {
    status: issues.length ? "needs_review" : "in_scope",
    reasoning: issues.length
      ? "The current execution brief may need clarification before handoff."
      : "The current brief matches a single local execution and does not expand into UI, API, or async automation work.",
    checked_against_rules: ruleNames.filter((ruleName) =>
      [
        "One-Agent-Per-Execution Rule",
        "Context-Pack Rule",
        "Scope-Drift Rule"
      ].includes(ruleName)
    ),
    issues
  };
}

function chooseNextAgent(workflowSteps) {
  const orchestratorIndex = workflowSteps.findIndex((step) => step === "Orchestrator");

  if (orchestratorIndex >= 0 && workflowSteps[orchestratorIndex + 1]) {
    return workflowSteps[orchestratorIndex + 1];
  }

  return "PM";
}

function buildRuleSummary(agentsMarkdown) {
  return agentsMarkdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("### ") || line.startsWith("- "))
    .slice(0, 24)
    .join("\n");
}

function buildNextPrompt(currentUnderstanding, scopeCheck, ruleNames, nextAgent) {
  const scopeText = currentUnderstanding.scope.length
    ? currentUnderstanding.scope.join("; ")
    : "Scope needs refinement from the context pack.";
  const constraintText = currentUnderstanding.constraints.length
    ? currentUnderstanding.constraints.join("; ")
    : "No explicit constraints captured.";
  const nonGoalText = currentUnderstanding.non_goals.length
    ? currentUnderstanding.non_goals.join("; ")
    : "No explicit non-goals captured.";
  const rulesText = ruleNames.length ? ruleNames.join("; ") : "Use AGENTS.md rules.";
  const scopeCheckText = scopeCheck.issues.length
    ? scopeCheck.issues.join("; ")
    : "No scope issues identified.";

  return [
    `You are the ${nextAgent} for the DIVYA Agent Company workflow.`,
    `Use the context pack at ${currentUnderstanding.context_pack} as the working brief.`,
    "Treat the context pack as the required Agent Runner v1 input.",
    "Treat idea.md or other raw source notes as optional supporting material only if the context pack references them.",
    `Current goal: ${currentUnderstanding.goal}`,
    `Current scope: ${scopeText}`,
    `Constraints: ${constraintText}`,
    `Non-goals: ${nonGoalText}`,
    `Scope check: ${scopeCheck.status}. ${scopeCheckText}`,
    `Apply these AGENTS.md rules: ${rulesText}`,
    "Your task is to refine the execution-ready brief without expanding scope.",
    "Return: clarified objective, acceptance criteria, risks or assumptions, and the recommended next handoff."
  ].join("\n");
}

function buildScopedLogFilePath(repoRoot, contextPackPath, suffix, timestamp) {
  const logsDir = path.join(repoRoot, "logs");
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const contextName = path.basename(contextPackPath, path.extname(contextPackPath));
  return path.join(logsDir, `${safeTimestamp}-${process.pid}-${contextName}-${suffix}.json`);
}

function buildScopedMarkdownPath(repoRoot, contextPackPath, suffix, timestamp) {
  const logsDir = path.join(repoRoot, "logs");
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const contextName = path.basename(contextPackPath, path.extname(contextPackPath));
  return path.join(logsDir, `${safeTimestamp}-${process.pid}-${contextName}-${suffix}.md`);
}

function saveLog(logFilePath, payload) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  fs.writeFileSync(logFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function saveMarkdown(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function saveStructuredWriteArtifact(filePath, artifact) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
}

function buildExecutionPrompt(agentTemplate, contextPackMarkdown, nextPrompt, stateMarkdown) {
  const sections = [
    "# Agent Template",
    agentTemplate.trim(),
    "",
    "# Context Pack",
    contextPackMarkdown.trim()
  ];

  if (stateMarkdown) {
    sections.push("");
    sections.push("# Workflow State");
    sections.push(stateMarkdown.trim());
  }

  sections.push("");
  sections.push("# Orchestrator Prompt");
  sections.push(nextPrompt.trim());

  return sections.join("\n");
}

function takeFirst(items, count) {
  return items.slice(0, count);
}

function buildMockAgentResult({ agentName, executionPrompt, currentUnderstanding, scopeCheck }) {
  const assumptions = currentUnderstanding.constraints.length
    ? takeFirst(currentUnderstanding.constraints, 2)
    : ["Constraints need confirmation from the context pack."];
  const acceptanceCriteria = currentUnderstanding.scope.length
    ? currentUnderstanding.scope.map((item) => `Execution brief accounts for: ${item}`)
    : ["Execution brief defines concrete scope items."];

  return {
    agent: agentName,
    mode: "mock-local-execution",
    summary: `${agentName} reviewed the orchestrator handoff and produced a deterministic brief refinement without calling external services.`,
    clarified_objective: currentUnderstanding.goal,
    acceptance_criteria: acceptanceCriteria,
    assumptions_or_risks: [
      ...assumptions.map((item) => `Constraint to preserve: ${item}`),
      `Scope check status: ${scopeCheck.status}`
    ],
    recommended_next_handoff: "Architect",
    prompt_source_preview: executionPrompt.split(/\r?\n/).slice(0, 12)
  };
}

function buildExecutionMarkdown({
  timestamp,
  agentName,
  mode,
  promptFile,
  model,
  content
}) {
  const modelLine = model ? `- Model: ${model}` : null;

  return [
    `# ${agentName} Execution Output`,
    "",
    "## Metadata",
    `- Timestamp: ${timestamp}`,
    `- Agent: ${agentName}`,
    `- Mode: ${mode}`,
    `- Prompt File: ${promptFile}`,
    modelLine,
    "",
    "## Output",
    content.trim()
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMockExecutionContent(result) {
  return [
    `Summary: ${result.summary}`,
    "",
    `Clarified Objective: ${result.clarified_objective}`,
    "",
    "Acceptance Criteria:",
    ...result.acceptance_criteria.map((item) => `- ${item}`),
    "",
    "Assumptions Or Risks:",
    ...result.assumptions_or_risks.map((item) => `- ${item}`),
    "",
    `Recommended Next Handoff: ${result.recommended_next_handoff}`
  ].join("\n");
}

function buildMockDevWriteArtifactContent(taskMarkdown) {
  const artifact = extractStructuredWriteArtifact(taskMarkdown || "");

  if (!artifact) {
    return null;
  }

  return [
    "Summary: Dev reviewed the selected task and emitted a structured write artifact from the task brief.",
    "",
    "Clarified Objective: Apply the explicit project-scoped file writes defined in the selected task artifact.",
    "",
    "Acceptance Criteria:",
    "- Structured write artifact is present.",
    "- Writes remain project-scoped only.",
    "",
    "Risks Or Assumptions:",
    "- This is a deterministic mock-local-execution for write-artifact verification.",
    "- The API must validate artifact paths before applying them.",
    "",
    "## Write Artifact",
    "",
    "```json",
    JSON.stringify(artifact, null, 2),
    "```",
    "",
    "Recommended Next Handoff: QA"
  ].join("\n");
}

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function extractGoalKeywords(goalText) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "using",
    "file",
    "files",
    "agent",
    "runner",
    "build",
    "execute"
  ]);

  return Array.from(
    new Set(
      normalizeText(goalText)
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 3)
        .filter((word) => !stopWords.has(word))
    )
  );
}

function hasStructuredSections(outputMarkdown) {
  const requiredMarkers = [
    "summary",
    "clarified objective",
    "acceptance criteria",
    "recommended next handoff"
  ];
  const normalized = normalizeText(outputMarkdown);

  return requiredMarkers.every((marker) => normalized.includes(marker));
}

function staysWithinScope(outputMarkdown, currentUnderstanding) {
  const outputText = normalizeText(outputMarkdown);
  const goalKeywords = extractGoalKeywords(currentUnderstanding.goal);
  const matchedKeywords = goalKeywords.filter((keyword) => outputText.includes(keyword));

  return {
    passed: goalKeywords.length === 0 || matchedKeywords.length >= Math.min(2, goalKeywords.length),
    matched_keywords: matchedKeywords
  };
}

function hasRequiredIdeaDependency(outputMarkdown) {
  const normalized = normalizeText(outputMarkdown);

  if (!normalized.includes("idea.md")) {
    return false;
  }

  const optionalContext = /(idea\.md.{0,60}(optional|not required|supporting))|((optional|not required|supporting).{0,60}idea\.md)/i;
  return !optionalContext.test(outputMarkdown);
}

function findForbiddenIntroductions(outputMarkdown, currentUnderstanding) {
  const normalized = normalizeText(outputMarkdown);
  const allowedContext = normalizeText(
    [
      currentUnderstanding.goal,
      currentUnderstanding.scope.join(" "),
      currentUnderstanding.features.join(" "),
      currentUnderstanding.constraints.join(" "),
      currentUnderstanding.non_goals.join(" ")
    ].join(" ")
  );

  const forbiddenChecks = [
    { label: "ui", pattern: /\b(ui|user interface)\b/i },
    { label: "api", pattern: /\bapi\b/i },
    { label: "async", pattern: /\basync\b/i },
    { label: "automation", pattern: /\bautomation\b/i },
    { label: "multi-agent chaining", pattern: /\b(multi-agent|multi agent|agent chaining)\b/i }
  ];

  return forbiddenChecks
    .filter(({ label, pattern }) => {
      if (allowedContext.includes(label)) {
        return false;
      }

      if (!pattern.test(normalized)) {
        return false;
      }

      const negativeMention = new RegExp(
        `(no|not|do not|without|avoid|exclude|prevent|bounded|capped|controlled|explicit)\\s+[^\\n]{0,40}${label.replace("-", "[- ]?")}`,
        "i"
      );
      return !negativeMention.test(outputMarkdown);
    })
    .map(({ label }) => label);
}

function hasNextHandoff(outputMarkdown) {
  const normalized = normalizeText(outputMarkdown);
  if (!normalized.includes("recommended next handoff")) {
    return false;
  }

  const match = outputMarkdown.match(/Recommended Next Handoff:?[ \t]*([^\n]+)/i);
  if (match && match[1].trim()) {
    return true;
  }

  return /##\s*Recommended Next Handoff[\s\S]{1,120}\S/i.test(outputMarkdown);
}

function buildQualityCheck({ outputMarkdown, currentUnderstanding }) {
  const structuredSectionsPassed = hasStructuredSections(outputMarkdown);
  const scopeCheck = staysWithinScope(outputMarkdown, currentUnderstanding);
  const ideaDependencyDetected = hasRequiredIdeaDependency(outputMarkdown);
  const forbiddenIntroductions = findForbiddenIntroductions(outputMarkdown, currentUnderstanding);
  const nextHandoffPassed = hasNextHandoff(outputMarkdown);

  const checks = [
    {
      name: "required_structured_sections_present",
      severity: "critical",
      passed: structuredSectionsPassed,
      detail: structuredSectionsPassed
        ? "Required output sections are present."
        : "Missing one or more required structured sections."
    },
    {
      name: "output_stays_within_scope",
      severity: "critical",
      passed: scopeCheck.passed,
      detail: scopeCheck.passed
        ? `Output aligns with goal keywords: ${scopeCheck.matched_keywords.join(", ") || "none required"}.`
        : "Output does not clearly align with the current goal keywords."
    },
    {
      name: "no_required_idea_md_dependency",
      severity: "critical",
      passed: !ideaDependencyDetected,
      detail: ideaDependencyDetected
        ? "Output appears to require idea.md as a runtime dependency."
        : "No required idea.md dependency detected."
    },
    {
      name: "no_disallowed_capabilities_introduced",
      severity: "critical",
      passed: forbiddenIntroductions.length === 0,
      detail: forbiddenIntroductions.length === 0
        ? "No disallowed UI/API/async/multi-agent capabilities introduced."
        : `Potential disallowed capabilities introduced: ${forbiddenIntroductions.join(", ")}.`
    },
    {
      name: "next_handoff_present",
      severity: "critical",
      passed: nextHandoffPassed,
      detail: nextHandoffPassed
        ? "Next handoff is present."
        : "Next handoff section or value is missing."
    }
  ];

  const warnings = checks.filter((check) => !check.passed).map((check) => check.detail);
  const criticalWarnings = checks
    .filter((check) => !check.passed && check.severity === "critical")
    .map((check) => check.detail);

  return {
    status: warnings.length === 0 ? "pass" : "warn",
    summary:
      warnings.length === 0
        ? "All lightweight quality checks passed."
        : `${warnings.length} quality warning${warnings.length === 1 ? "" : "s"} detected.`,
    warnings,
    critical_warnings: criticalWarnings,
    checks
  };
}

function validateChainMode({ chainSteps, shouldExecute, directAgent }) {
  if (!chainSteps) {
    return;
  }

  if (chainSteps !== "2" && chainSteps !== "3" && chainSteps !== "4") {
    throw new Error(`Unsupported chain length: ${chainSteps}. Only --chain 2, --chain 3, and --chain 4 are supported.`);
  }

  if (!shouldExecute) {
    throw new Error(`--chain ${chainSteps} requires --execute.`);
  }

  if (directAgent) {
    throw new Error(`--chain ${chainSteps} cannot be used with --agent.`);
  }
}

function validateQaBranchMode({ chainSteps, directAgent, useQaBranch }) {
  if (!useQaBranch) {
    return;
  }

  if (directAgent) {
    throw new Error("--qa cannot be used with --agent. Use direct QA with --agent qa, or use --execute --chain 4 --qa.");
  }

  if (chainSteps !== "4") {
    throw new Error("--qa requires --execute --chain 4.");
  }
}

function buildChainResult({
  chainSteps,
  pmExecutionPayload,
  architectExecutionPayload,
  taskPlannerExecutionPayload,
  qaExecutionPayload
}) {
  if (!chainSteps) {
    return null;
  }

  const requestedSteps = Number(chainSteps);
  const pmCriticalWarnings = pmExecutionPayload ? pmExecutionPayload.quality_check.critical_warnings : [];
  const architectCriticalWarnings = architectExecutionPayload
    ? architectExecutionPayload.quality_check.critical_warnings
    : [];
  const finalExecutionPayload = qaExecutionPayload || taskPlannerExecutionPayload;
  const finalStepLabel = qaExecutionPayload ? "QA" : "Task Planner";
  const finalCriticalWarnings = finalExecutionPayload
    ? finalExecutionPayload.quality_check.critical_warnings
    : [];
  const stoppedOnPm = pmCriticalWarnings.length > 0;
  const stoppedOnArchitect = architectCriticalWarnings.length > 0;
  const stoppedOnFinal = finalCriticalWarnings.length > 0;
  const completedSteps = finalExecutionPayload ? 4 : architectExecutionPayload ? 3 : pmExecutionPayload ? 2 : 1;

  let status = "completed";
  let stopReason = null;

  if (stoppedOnPm) {
    status = "stopped_on_quality_warning";
    stopReason = `PM output has ${pmCriticalWarnings.length} critical quality warning${
      pmCriticalWarnings.length === 1 ? "" : "s"
    }.`;
  } else if ((requestedSteps === 3 || requestedSteps === 4) && stoppedOnArchitect) {
    status = "stopped_on_quality_warning";
    stopReason = `Architect output has ${architectCriticalWarnings.length} critical quality warning${
      architectCriticalWarnings.length === 1 ? "" : "s"
    }.`;
  } else if (requestedSteps === 4 && stoppedOnFinal) {
    status = "stopped_on_quality_warning";
    stopReason = `${finalStepLabel} output has ${finalCriticalWarnings.length} critical quality warning${
      finalCriticalWarnings.length === 1 ? "" : "s"
    }.`;
  }

  return {
    requested_steps: requestedSteps,
    completed_steps: completedSteps,
    status,
    stop_reason: stopReason,
    final_agent: finalExecutionPayload
      ? finalExecutionPayload.workflow_step
      : architectExecutionPayload
      ? architectExecutionPayload.workflow_step
      : pmExecutionPayload
        ? pmExecutionPayload.workflow_step
        : null,
    critical_warnings: stoppedOnFinal
      ? finalCriticalWarnings
      : stoppedOnArchitect
        ? architectCriticalWarnings
        : pmCriticalWarnings,
    step_summaries: [
      pmExecutionPayload ? buildChainStepSummary("PM", pmExecutionPayload) : null,
      architectExecutionPayload ? buildChainStepSummary("Architect", architectExecutionPayload) : null,
      qaExecutionPayload
        ? buildChainStepSummary("QA", qaExecutionPayload)
        : taskPlannerExecutionPayload
          ? buildChainStepSummary("Task Planner", taskPlannerExecutionPayload)
          : null
    ].filter(Boolean)
  };
}

async function callOpenAiForAgentExecution({ instructions, input }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for --llm execution.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_LLM_MODEL,
      reasoning: { effort: "low" },
      instructions,
      input
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API request failed (${response.status}): ${errorBody.slice(0, 400)}`);
  }

  return response.json();
}

function validateExecutionMode({ shouldExecute, useLlm }) {
  if (shouldExecute && useLlm && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for --llm execution.");
  }
}

function validateDirectAgentMode({ directAgent, useLlm }) {
  if (directAgent && useLlm && !process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for --llm execution.");
  }
}

function extractResponseText(responseBody) {
  if (typeof responseBody.output_text === "string" && responseBody.output_text.trim()) {
    return responseBody.output_text.trim();
  }

  const outputItems = Array.isArray(responseBody.output) ? responseBody.output : [];
  const textParts = [];

  for (const item of outputItems) {
    const contentItems = Array.isArray(item.content) ? item.content : [];
    for (const contentItem of contentItems) {
      if (contentItem.type === "output_text" && typeof contentItem.text === "string") {
        textParts.push(contentItem.text);
      }
    }
  }

  const combined = textParts.join("\n").trim();

  if (!combined) {
    throw new Error("OpenAI API response did not contain text output.");
  }

  return combined;
}

function buildLlmInstructions({ agentsMarkdown, workflowMarkdown, agentTemplate, agentName }) {
  const responseFormat =
    agentName === "ux-designer"
      ? "Respond in concise markdown with these sections: Summary, Design Goal, Design Handoff, Recommended Next Handoff."
      : "Respond in concise markdown with these sections: Summary, Clarified Objective, Acceptance Criteria, Risks Or Assumptions, Recommended Next Handoff.";

  return [
    "You are executing one agent step inside the DIVYA Agent Company system.",
    "Stay within the current execution. Do not chain to multiple agents.",
    "Treat the context pack as the required Agent Runner v1 input.",
    "Treat idea.md or other raw source notes as optional supporting material only if the context pack references them.",
    "Do not invent UI, API, or async automation work unless already in scope.",
    responseFormat,
    "",
    "# Repo Rules",
    buildRuleSummary(agentsMarkdown),
    "",
    "# Workflow Reference",
    workflowMarkdown.trim(),
    "",
    "# Agent Role Prompt",
    agentTemplate.trim()
  ].join("\n");
}

function buildLlmInput({
  contextPackMarkdown,
  executionRequest,
  stateMarkdown,
  artifactMarkdown,
  taskMarkdown,
  designHandoffMarkdown
}) {
  const sections = [
    "# Context Pack",
    contextPackMarkdown.trim()
  ];

  if (stateMarkdown) {
    sections.push("");
    sections.push("# Workflow State");
    sections.push(stateMarkdown.trim());
  }

  if (taskMarkdown) {
    sections.push("");
    sections.push("# Selected Task");
    sections.push(taskMarkdown.trim());
  }

  if (artifactMarkdown) {
    sections.push("");
    sections.push("# Artifact Context");
    sections.push(artifactMarkdown.trim());
  }

  if (designHandoffMarkdown) {
    sections.push("");
    sections.push("# Design Handoff");
    sections.push(designHandoffMarkdown.trim());
  }

  sections.push("");
  sections.push("# Execution Request");
  sections.push(executionRequest.trim());

  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: sections.join("\n")
        }
      ]
    }
  ];
}

function inferProjectIdFromWorkspacePath(repoRoot, candidatePath) {
  if (!candidatePath) {
    return null;
  }

  const relativePath = path.relative(repoRoot, path.resolve(candidatePath));
  const segments = relativePath.split(path.sep).filter(Boolean);

  if (segments[0] !== "projects" || !segments[1]) {
    return null;
  }

  return segments[1];
}

function findProjectDesignHandoffPath(repoRoot, projectId) {
  if (!projectId) {
    return null;
  }

  const handoffPath = path.join(repoRoot, "projects", projectId, "design", "handoff.md");
  return fs.existsSync(handoffPath) ? handoffPath : null;
}

function buildDirectAgentRequest(agentName, currentUnderstanding, selectedTaskFilePath) {
  const scopeText = currentUnderstanding.scope.length
    ? currentUnderstanding.scope.join("; ")
    : "Scope needs refinement from the context pack.";
  const constraintText = currentUnderstanding.constraints.length
    ? currentUnderstanding.constraints.join("; ")
    : "No explicit constraints captured.";
  const nonGoalText = currentUnderstanding.non_goals.length
    ? currentUnderstanding.non_goals.join("; ")
    : "No explicit non-goals captured.";

  return [
    `You are executing the ${agentName} role directly for Agent Runner v1.`,
    `Use the context pack at ${currentUnderstanding.context_pack} as the working brief.`,
    "Treat the context pack as the required Agent Runner v1 input.",
    "Treat idea.md or other raw source notes as optional supporting material only if the context pack references them.",
    `Current goal: ${currentUnderstanding.goal}`,
    `Current scope: ${scopeText}`,
    `Constraints: ${constraintText}`,
    `Non-goals: ${nonGoalText}`,
    selectedTaskFilePath
      ? `Selected task file: ${selectedTaskFilePath}. Execute or reason only on that selected task.`
      : agentName === "dev"
        ? "No selected task file was provided. Warn clearly that Dev requires exactly one selected task and do not act on multiple tasks."
        : "No selected task file provided.",
    agentName === "dev"
      ? [
          "If this Dev run needs to create or replace files inside a selected project workspace, include a final `## Write Artifact` section.",
          "That section must contain exactly one fenced `json` block with this shape:",
          '{ "version": 1, "writes": [ { "path": "projects/<project-id>/...", "content": "full file content" } ] }',
          "Use one or more `writes` entries when the selected task requires multiple project files.",
          "Each entry must contain the full replacement content for exactly one target file.",
          "Only include that section for explicit full-file create/replace writes. Do not describe writes only in prose."
        ].join(" ")
      : "Do not invent structured write artifacts unless your role prompt explicitly requires them.",
    "Return only the structured result expected by the agent prompt."
  ].join("\n");
}

function buildArchitectRequestFromPm(pmExecutionPayload) {
  return [
    "Use the PM output below as the Architect handoff for the current execution.",
    "Stay within the same execution scope and produce only the Architect result.",
    "Do not redesign already-completed capabilities if the PM handoff or workflow state says they already exist.",
    "",
    "# PM Handoff",
    pmExecutionPayload.output_markdown.trim()
  ].join("\n");
}

function buildTaskPlannerRequestFromArchitect(architectExecutionPayload) {
  return [
    "Use the Architect output below as the Task Planner handoff for the current execution.",
    "Convert the approved design into small executable tasks only.",
    "Do not expand the feature scope beyond the Architect handoff and current workflow state.",
    "",
    "# Architect Handoff",
    architectExecutionPayload.output_markdown.trim()
  ].join("\n");
}

function buildQaRequestFromArchitect(architectExecutionPayload) {
  return [
    "Use the Architect output below as the QA handoff for the current execution.",
    "Review whether the Architect output is clear enough for the next bounded handoff.",
    "Treat the context pack as the primary input and the Architect artifact as supporting context.",
    "QA replaces Task Planner in this run. Do not continue to Task Planner in the same execution.",
    "",
    "# Architect Handoff",
    architectExecutionPayload.output_markdown.trim()
  ].join("\n");
}

function buildChainStepSummary(agentName, executionPayload) {
  return {
    agent: agentName,
    quality_status: executionPayload.quality_check.status,
    quality_summary: executionPayload.quality_check.summary,
    critical_warnings: executionPayload.quality_check.critical_warnings,
    saved_to: executionPayload.saved_to
  };
}

async function executeNextAgent({
  repoRoot,
  contextPackPath,
  contextPackMarkdown,
  stateFilePath,
  stateMarkdown,
  taskFilePath,
  taskMarkdown,
  artifactFilePath,
  artifactMarkdown,
  designHandoffFilePath,
  designHandoffMarkdown,
  agentContextFiles,
  agentsMarkdown,
  workflowMarkdown,
  currentUnderstanding,
  scopeCheck,
  nextAgent,
  nextPrompt,
  timestamp,
  executionMode,
  toolAudit
}) {
  const promptFileName = `${slugifyAgentName(nextAgent)}.md`;
  const promptFilePath = path.join(repoRoot, "prompts", promptFileName);
  let agentTemplate;

  try {
    agentTemplate = readFile(repoRoot, nextAgent, promptFilePath, toolAudit);
  } catch (error) {
    if (error.message.startsWith("File not found:")) {
      throw new Error(`Prompt file not found for agent "${slugifyAgentName(nextAgent)}": ${promptFilePath}`);
    }
    throw error;
  }

  const executionPrompt = buildExecutionPrompt(agentTemplate, contextPackMarkdown, nextPrompt, stateMarkdown);
  const promptFileRelative = path.relative(repoRoot, promptFilePath);

  let executionSummary;
  let markdownOutput;
  let writeArtifact = null;

  if (executionMode === "llm") {
    const llmResponse = await callOpenAiForAgentExecution({
      instructions: buildLlmInstructions({
        agentsMarkdown,
        workflowMarkdown,
        agentTemplate,
        agentName: nextAgent
      }),
      input: buildLlmInput({
        contextPackMarkdown,
        executionRequest: nextPrompt,
        stateMarkdown,
        artifactMarkdown,
        taskMarkdown,
        designHandoffMarkdown
      })
    });

    const responseText = extractResponseText(llmResponse);
    markdownOutput = buildExecutionMarkdown({
      timestamp,
      agentName: nextAgent,
      mode: "llm",
      promptFile: promptFileRelative,
      model: DEFAULT_LLM_MODEL,
      content: responseText
    });
    if (nextAgent === "dev") {
      writeArtifact = extractStructuredWriteArtifact(responseText);
    }

    executionSummary = {
      timestamp,
      executed_at: timestamp,
      workflow_step: nextAgent,
      mode: "llm",
      model: DEFAULT_LLM_MODEL,
      prompt_file: promptFileRelative,
      state_file: stateFilePath ? path.relative(repoRoot, stateFilePath) : null,
      task_file: taskFilePath ? path.relative(repoRoot, taskFilePath) : null,
      artifact_file: artifactFilePath ? path.relative(repoRoot, artifactFilePath) : null,
      design_handoff_file: designHandoffFilePath
        ? path.relative(repoRoot, designHandoffFilePath)
        : null,
      context_files: agentContextFiles,
      tool_audit: toolAudit,
      output_preview: responseText.split(/\r?\n/).slice(0, 12)
    };
  } else {
    const executionResult = buildMockAgentResult({
      agentName: nextAgent,
      executionPrompt,
      currentUnderstanding,
      scopeCheck
    });

    const mockContent =
      nextAgent === "dev" ? buildMockDevWriteArtifactContent(taskMarkdown) : null;

    markdownOutput = buildExecutionMarkdown({
      timestamp,
      agentName: nextAgent,
      mode: "mock-local-execution",
      promptFile: promptFileRelative,
      content: mockContent || buildMockExecutionContent(executionResult)
    });

    if (nextAgent === "dev" && taskMarkdown) {
      writeArtifact = extractStructuredWriteArtifact(taskMarkdown);
    }

    executionSummary = {
      timestamp,
      executed_at: timestamp,
      workflow_step: nextAgent,
      mode: "mock-local-execution",
      prompt_file: promptFileRelative,
      state_file: stateFilePath ? path.relative(repoRoot, stateFilePath) : null,
      task_file: taskFilePath ? path.relative(repoRoot, taskFilePath) : null,
      artifact_file: artifactFilePath ? path.relative(repoRoot, artifactFilePath) : null,
      design_handoff_file: designHandoffFilePath
        ? path.relative(repoRoot, designHandoffFilePath)
        : null,
      context_files: agentContextFiles,
      tool_audit: toolAudit,
      result: executionResult
    };
  }

  const markdownPath = buildScopedMarkdownPath(
    repoRoot,
    contextPackPath,
    `${slugifyAgentName(nextAgent)}-execution`,
    timestamp
  );

  saveMarkdown(markdownPath, markdownOutput);

  let writeArtifactRelativePath = null;

  if (writeArtifact) {
    validateStructuredWriteArtifactShape(writeArtifact);
    const writeArtifactPath = buildScopedLogFilePath(
      repoRoot,
      contextPackPath,
      `${slugifyAgentName(nextAgent)}-writes`,
      timestamp
    );
    saveStructuredWriteArtifact(writeArtifactPath, writeArtifact);
    writeArtifactRelativePath = path.relative(repoRoot, writeArtifactPath);
  }

  const qualityCheck = buildQualityCheck({
    outputMarkdown: markdownOutput,
    currentUnderstanding
  });

  return {
    ...executionSummary,
    quality_check: qualityCheck,
    output_markdown: markdownOutput,
    write_artifact: writeArtifactRelativePath,
    saved_to: path.relative(repoRoot, markdownPath)
  };
}

async function runDirectAgent({
  repoRoot,
  contextPackPath,
  stateFilePath,
  stateMarkdown,
  taskFilePath,
  taskMarkdown,
  artifactFilePath,
  artifactMarkdown,
  designHandoffFilePath,
  designHandoffMarkdown,
  agentContextFiles,
  agentsMarkdown,
  workflowMarkdown,
  contextPackMarkdown,
  currentUnderstanding,
  scopeCheck,
  directAgent,
  timestamp,
  useLlm,
  toolAudit
}) {
  const normalizedAgent = slugifyAgentName(directAgent);
  const selectedTaskRelativePath = taskFilePath ? path.relative(repoRoot, taskFilePath) : null;
  const directRequest = buildDirectAgentRequest(normalizedAgent, currentUnderstanding, selectedTaskRelativePath);
  const combinedRunLogFilePath = buildScopedLogFilePath(repoRoot, contextPackPath, `${normalizedAgent}-run`, timestamp);
  const artifactRelativePath = artifactFilePath ? path.relative(repoRoot, artifactFilePath) : null;

  const executionPayload = await executeNextAgent({
    repoRoot,
    contextPackPath,
    contextPackMarkdown,
    stateFilePath,
    stateMarkdown,
    taskFilePath,
    taskMarkdown,
    artifactFilePath,
    artifactMarkdown,
    designHandoffFilePath,
    designHandoffMarkdown,
    agentContextFiles,
    toolAudit,
    agentsMarkdown,
    workflowMarkdown,
    currentUnderstanding,
    scopeCheck,
    nextAgent: normalizedAgent,
    nextPrompt: directRequest,
    timestamp,
    executionMode: useLlm ? "llm" : "mock"
  });

  const combinedRunPayload = {
    timestamp,
    execution_mode: useLlm ? "llm" : "mock",
    context_pack: path.relative(process.cwd(), contextPackPath),
    direct_agent: normalizedAgent,
    state_file: stateFilePath ? path.relative(repoRoot, stateFilePath) : null,
    task_file: selectedTaskRelativePath,
    artifact_file: artifactRelativePath,
    design_handoff_file: designHandoffFilePath ? path.relative(repoRoot, designHandoffFilePath) : null,
    context_files: agentContextFiles,
    tool_audit: toolAudit,
    executed_agent_log: executionPayload.saved_to,
    write_artifact: executionPayload.write_artifact || null,
    quality_check: executionPayload.quality_check,
    executed_agent: {
      timestamp: executionPayload.timestamp,
      workflow_step: executionPayload.workflow_step,
      mode: executionPayload.mode,
      prompt_file: executionPayload.prompt_file,
      saved_to: executionPayload.saved_to,
      write_artifact: executionPayload.write_artifact || null,
      quality_check: executionPayload.quality_check,
      model: executionPayload.model || null
    }
  };

  saveLog(combinedRunLogFilePath, combinedRunPayload);

  return {
    direct_agent: normalizedAgent,
    task_file: selectedTaskRelativePath,
    artifact_file: artifactRelativePath,
    tool_audit: toolAudit,
    executed_agent: executionPayload,
    combined_run_log: path.relative(repoRoot, combinedRunLogFilePath)
  };
}

async function runAgent({
  repoRoot,
  contextPackPath,
  shouldExecute = false,
  useLlm = false,
  directAgent = null,
  taskPath = null,
  artifactPath = null,
  chainSteps = null,
  useQaBranch = false
}) {
  const timestamp = new Date().toISOString();
  const toolAudit = [];

  validateExecutionMode({ shouldExecute, useLlm });
  validateDirectAgentMode({ directAgent, useLlm });
  validateChainMode({ chainSteps, shouldExecute, directAgent });
  validateQaBranchMode({ chainSteps, directAgent, useQaBranch });

  const activeRole = directAgent || "Orchestrator";
  const stateFilePath = buildStateFilePath(repoRoot, contextPackPath);
  const stateMarkdown = readOptionalFile(repoRoot, activeRole, stateFilePath, toolAudit);
  const selectedTaskPath =
    directAgent && slugifyAgentName(directAgent) === "dev" && taskPath ? path.resolve(process.cwd(), taskPath) : null;
  const artifactFilePath = artifactPath ? path.resolve(process.cwd(), artifactPath) : null;
  const inferredProjectId =
    inferProjectIdFromWorkspacePath(repoRoot, selectedTaskPath) ||
    inferProjectIdFromWorkspacePath(repoRoot, artifactFilePath) ||
    inferProjectIdFromWorkspacePath(repoRoot, contextPackPath);
  const designHandoffPath = findProjectDesignHandoffPath(repoRoot, inferredProjectId);
  const agentContext = buildAgentContext({
    repoRoot,
    contextPackPath,
    taskPath: selectedTaskPath,
    additionalPaths: designHandoffPath ? [designHandoffPath] : [],
    role: activeRole,
    auditTrail: toolAudit
  });
  const contextPackMarkdown = agentContext.contextPackMarkdown;
  const agentsMarkdown = agentContext.agentsMarkdown;
  const workflowMarkdown = agentContext.workflowMarkdown;
  const taskFilePath = agentContext.taskFilePath;
  const taskMarkdown = agentContext.taskMarkdown;
  const artifactMarkdown = artifactFilePath ? readFile(repoRoot, activeRole, artifactFilePath, toolAudit) : null;
  const designHandoffFilePath = designHandoffPath || null;
  const designHandoffMarkdown =
    agentContext.additionalContextFiles.find((file) => file.path === designHandoffFilePath)?.markdown || null;

  const contextSections = parseSections(contextPackMarkdown);
  const workflowSteps = parseWorkflowSteps(workflowMarkdown);
  const ruleNames = parseRuleNames(agentsMarkdown);
  const currentUnderstanding = buildCurrentUnderstanding(contextPackPath, contextSections);
  const scopeCheck = buildScopeCheck(currentUnderstanding, ruleNames);

  if (directAgent) {
    return runDirectAgent({
      repoRoot,
      contextPackPath,
      stateFilePath: stateMarkdown ? stateFilePath : null,
      stateMarkdown,
      taskFilePath,
      taskMarkdown,
      artifactFilePath,
      artifactMarkdown,
      designHandoffFilePath,
      designHandoffMarkdown,
      agentContextFiles: agentContext.files,
      toolAudit,
      agentsMarkdown,
      workflowMarkdown,
      contextPackMarkdown,
      currentUnderstanding,
      scopeCheck,
      directAgent,
      timestamp,
      useLlm
    });
  }

  const nextAgent = chooseNextAgent(workflowSteps);
  const nextPrompt = buildNextPrompt(currentUnderstanding, scopeCheck, ruleNames, nextAgent);

  const orchestratorLogFilePath = buildScopedLogFilePath(repoRoot, contextPackPath, "orchestrator", timestamp);
  const combinedRunLogFilePath = buildScopedLogFilePath(repoRoot, contextPackPath, "run", timestamp);
  const filesToSave = [
    path.relative(repoRoot, orchestratorLogFilePath),
    path.relative(repoRoot, combinedRunLogFilePath)
  ];

  const orchestratorPayload = {
    timestamp,
    generated_at: timestamp,
    workflow_step: "Orchestrator",
    state_file: stateMarkdown ? path.relative(repoRoot, stateFilePath) : null,
    context_files: agentContext.files,
    tool_audit: toolAudit,
    current_understanding: currentUnderstanding,
    scope_check: scopeCheck,
    next_agent: nextAgent,
    next_prompt: nextPrompt,
    files_to_save: filesToSave
  };

  saveLog(orchestratorLogFilePath, orchestratorPayload);

  let executionPayload = null;
  let pmExecutionPayload = null;
  let architectExecutionPayload = null;
  let taskPlannerExecutionPayload = null;
  let qaExecutionPayload = null;

  if (shouldExecute) {
    pmExecutionPayload = await executeNextAgent({
      repoRoot,
      contextPackPath,
      contextPackMarkdown,
      stateFilePath: stateMarkdown ? stateFilePath : null,
      stateMarkdown,
      agentContextFiles: agentContext.files,
      toolAudit,
      agentsMarkdown,
      workflowMarkdown,
      currentUnderstanding,
      scopeCheck,
      nextAgent,
      nextPrompt,
      timestamp,
      executionMode: useLlm ? "llm" : "mock",
      designHandoffFilePath,
      designHandoffMarkdown
    });
    executionPayload = pmExecutionPayload;
    filesToSave.push(pmExecutionPayload.saved_to);

    if (chainSteps === "3" && pmExecutionPayload.quality_check.critical_warnings.length === 0) {
      architectExecutionPayload = await executeNextAgent({
        repoRoot,
        contextPackPath,
        contextPackMarkdown,
        stateFilePath: stateMarkdown ? stateFilePath : null,
        stateMarkdown,
        agentContextFiles: agentContext.files,
        toolAudit,
        agentsMarkdown,
        workflowMarkdown,
        currentUnderstanding,
        scopeCheck,
        nextAgent: "architect",
        nextPrompt: buildArchitectRequestFromPm(pmExecutionPayload),
        timestamp,
        executionMode: useLlm ? "llm" : "mock",
        designHandoffFilePath,
        designHandoffMarkdown
      });
      executionPayload = architectExecutionPayload;
      filesToSave.push(architectExecutionPayload.saved_to);
    }

    if (
      chainSteps === "4" &&
      pmExecutionPayload.quality_check.critical_warnings.length === 0
    ) {
      architectExecutionPayload = await executeNextAgent({
        repoRoot,
        contextPackPath,
        contextPackMarkdown,
        stateFilePath: stateMarkdown ? stateFilePath : null,
        stateMarkdown,
        agentContextFiles: agentContext.files,
        toolAudit,
        agentsMarkdown,
        workflowMarkdown,
        currentUnderstanding,
        scopeCheck,
        nextAgent: "architect",
        nextPrompt: buildArchitectRequestFromPm(pmExecutionPayload),
        timestamp,
        executionMode: useLlm ? "llm" : "mock",
        designHandoffFilePath,
        designHandoffMarkdown
      });
      executionPayload = architectExecutionPayload;
      filesToSave.push(architectExecutionPayload.saved_to);

      if (architectExecutionPayload.quality_check.critical_warnings.length === 0) {
        const finalAgent = useQaBranch ? "qa" : "task-planner";
        const finalPrompt = useQaBranch
          ? buildQaRequestFromArchitect(architectExecutionPayload)
          : buildTaskPlannerRequestFromArchitect(architectExecutionPayload);
        const finalArtifactFilePath = useQaBranch
          ? path.join(repoRoot, architectExecutionPayload.saved_to)
          : null;
        const finalArtifactMarkdown = useQaBranch
          ? architectExecutionPayload.output_markdown
          : null;
        const finalExecutionPayload = await executeNextAgent({
          repoRoot,
          contextPackPath,
          contextPackMarkdown,
          stateFilePath: stateMarkdown ? stateFilePath : null,
          stateMarkdown,
          artifactFilePath: finalArtifactFilePath,
          artifactMarkdown: finalArtifactMarkdown,
          agentContextFiles: agentContext.files,
          toolAudit,
          agentsMarkdown,
          workflowMarkdown,
          currentUnderstanding,
          scopeCheck,
          nextAgent: finalAgent,
          nextPrompt: finalPrompt,
          timestamp,
          executionMode: useLlm ? "llm" : "mock",
          designHandoffFilePath,
          designHandoffMarkdown
        });
        executionPayload = finalExecutionPayload;
        filesToSave.push(finalExecutionPayload.saved_to);

        if (useQaBranch) {
          qaExecutionPayload = finalExecutionPayload;
        } else {
          taskPlannerExecutionPayload = finalExecutionPayload;
        }
      }
    }

    orchestratorPayload.files_to_save = filesToSave;
    saveLog(orchestratorLogFilePath, orchestratorPayload);
  }

  const chainResult = buildChainResult({
    chainSteps,
    pmExecutionPayload,
    architectExecutionPayload,
    taskPlannerExecutionPayload,
    qaExecutionPayload
  });

  const combinedRunPayload = {
    timestamp,
    execution_mode: useLlm ? "llm" : "mock",
    chain: chainResult,
    context_pack: path.relative(process.cwd(), contextPackPath),
    orchestrator_log: path.relative(repoRoot, orchestratorLogFilePath),
    executed_agent_log: executionPayload ? executionPayload.saved_to : null,
    tool_audit: toolAudit,
    quality_check: executionPayload ? executionPayload.quality_check : null,
    pm_agent_log: pmExecutionPayload ? pmExecutionPayload.saved_to : null,
    architect_agent_log: architectExecutionPayload ? architectExecutionPayload.saved_to : null,
    qa_agent_log: qaExecutionPayload ? qaExecutionPayload.saved_to : null,
    task_planner_agent_log: taskPlannerExecutionPayload ? taskPlannerExecutionPayload.saved_to : null,
    orchestrator: orchestratorPayload,
    pm_agent: pmExecutionPayload
      ? {
          timestamp: pmExecutionPayload.timestamp,
          workflow_step: pmExecutionPayload.workflow_step,
          mode: pmExecutionPayload.mode,
          prompt_file: pmExecutionPayload.prompt_file,
          saved_to: pmExecutionPayload.saved_to,
          quality_check: pmExecutionPayload.quality_check,
          model: pmExecutionPayload.model || null
        }
      : null,
    architect_agent: architectExecutionPayload
      ? {
          timestamp: architectExecutionPayload.timestamp,
          workflow_step: architectExecutionPayload.workflow_step,
          mode: architectExecutionPayload.mode,
          prompt_file: architectExecutionPayload.prompt_file,
          saved_to: architectExecutionPayload.saved_to,
          quality_check: architectExecutionPayload.quality_check,
          model: architectExecutionPayload.model || null
        }
      : null,
    qa_agent: qaExecutionPayload
      ? {
          timestamp: qaExecutionPayload.timestamp,
          workflow_step: qaExecutionPayload.workflow_step,
          mode: qaExecutionPayload.mode,
          prompt_file: qaExecutionPayload.prompt_file,
          saved_to: qaExecutionPayload.saved_to,
          quality_check: qaExecutionPayload.quality_check,
          model: qaExecutionPayload.model || null
        }
      : null,
    task_planner_agent: taskPlannerExecutionPayload
      ? {
          timestamp: taskPlannerExecutionPayload.timestamp,
          workflow_step: taskPlannerExecutionPayload.workflow_step,
          mode: taskPlannerExecutionPayload.mode,
          prompt_file: taskPlannerExecutionPayload.prompt_file,
          saved_to: taskPlannerExecutionPayload.saved_to,
          quality_check: taskPlannerExecutionPayload.quality_check,
          model: taskPlannerExecutionPayload.model || null
        }
      : null,
    executed_agent: executionPayload
      ? {
          timestamp: executionPayload.timestamp,
          workflow_step: executionPayload.workflow_step,
          mode: executionPayload.mode,
          prompt_file: executionPayload.prompt_file,
          saved_to: executionPayload.saved_to,
          quality_check: executionPayload.quality_check,
          model: executionPayload.model || null
        }
      : null
  };

  saveLog(combinedRunLogFilePath, combinedRunPayload);

  return {
    chain: chainResult,
    orchestrator: orchestratorPayload,
    pm_agent: pmExecutionPayload,
    architect_agent: architectExecutionPayload,
    qa_agent: qaExecutionPayload,
    task_planner_agent: taskPlannerExecutionPayload,
    tool_audit: toolAudit,
    executed_agent: executionPayload,
    combined_run_log: path.relative(repoRoot, combinedRunLogFilePath)
  };
}

module.exports = {
  runAgent
};
