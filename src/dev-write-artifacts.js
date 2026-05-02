const WRITE_ARTIFACT_SECTION_NAME = "Write Artifact";

function extractSectionBody(markdown, sectionName = WRITE_ARTIFACT_SECTION_NAME) {
  if (typeof markdown !== "string" || !markdown.trim()) {
    return null;
  }

  const lines = markdown.split(/\r?\n/);
  const targetHeading = `## ${sectionName}`.toLowerCase();
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === targetHeading);

  if (startIndex === -1) {
    return null;
  }

  const sectionLines = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^##\s+/.test(line)) {
      break;
    }

    sectionLines.push(line);
  }

  return sectionLines.join("\n");
}

function extractStructuredWriteArtifact(markdown, sectionName = WRITE_ARTIFACT_SECTION_NAME) {
  const sectionBody = extractSectionBody(markdown, sectionName);

  if (!sectionBody) {
    return null;
  }

  const jsonMatch = sectionBody.match(/```json\s*([\s\S]*?)```/i);

  if (!jsonMatch) {
    throw new Error(`Structured write artifact section must contain a \`\`\`json code block.`);
  }

  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch (error) {
    throw new Error(`Structured write artifact JSON is invalid: ${error.message}`);
  }
}

function validateStructuredWriteArtifactShape(artifact) {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
    throw new Error("Structured write artifact must be a JSON object.");
  }

  if (artifact.version !== 1) {
    throw new Error("Structured write artifact `version` must be `1`.");
  }

  if (!Array.isArray(artifact.writes) || artifact.writes.length === 0) {
    throw new Error("Structured write artifact must include a non-empty `writes` array.");
  }

  artifact.writes.forEach((write, index) => {
    if (!write || typeof write !== "object" || Array.isArray(write)) {
      throw new Error(`Structured write artifact entry ${index + 1} must be an object.`);
    }

    if (typeof write.path !== "string" || !write.path.trim()) {
      throw new Error(`Structured write artifact entry ${index + 1} requires a non-empty \`path\`.`);
    }

    if (typeof write.content !== "string") {
      throw new Error(`Structured write artifact entry ${index + 1} requires string \`content\`.`);
    }
  });
}

module.exports = {
  WRITE_ARTIFACT_SECTION_NAME,
  extractStructuredWriteArtifact,
  validateStructuredWriteArtifactShape
};
