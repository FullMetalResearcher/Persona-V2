import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { elapsedMs, normalizeHttpUrl, runCli } from "./lib.mjs";
import { SAMPLE_COUNT } from "./halton-sampler.mjs";

export function mdText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/([`*_[\]#|])/g, "\\$1")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function mdCell(value) {
  return mdText(value).replace(/\s+/g, " ").trim();
}

function sentence(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function renderList(items) {
  return (items || []).map((item) => `- ${mdCell(item)}`).join("\n");
}

function renderEvidenceReference(item) {
  const source = mdCell(item.source);
  const safeUrl = normalizeHttpUrl(item.url);
  const accessed = item.accessed_at ? ` · accessed ${mdCell(item.accessed_at)}` : "";
  if (!safeUrl) return `${source}${accessed}`;
  return `[${source}](<${safeUrl}>)${accessed}`;
}

const EVIDENCE_MIX_LABELS = {
  "buyer-language": ["first-person account", "first-person accounts"],
  "current-behavior": ["behavior observation", "behavior observations"],
  alternative: ["alternative-product page", "alternative-product pages"],
  "switching-barrier": ["switching-barrier source", "switching-barrier sources"],
  regulation: ["regulatory source", "regulatory sources"],
  pricing: ["pricing source", "pricing sources"],
  "user-provided": ["builder-supplied item", "builder-supplied items"],
};

function renderEvidenceMix(evidence) {
  const counts = new Map();
  (evidence || []).forEach((item) => {
    counts.set(item.type, (counts.get(item.type) || 0) + 1);
  });
  const parts = [...counts.entries()].map(([type, count]) => {
    const labels = EVIDENCE_MIX_LABELS[type];
    const singular = labels?.[0] || mdCell(type);
    const plural = labels?.[1] || mdCell(type);
    return `${count} ${count === 1 ? singular : plural}`;
  });
  if (parts.length === 0) return "No external evidence was available; treat every objection as a hypothesis.";
  return `${parts.join(", ")}.`;
}

function renderFactorRows(factors) {
  return (factors || [])
    .map((factor) => {
      const evidence = (factor.evidence_ids || []).join(", ") || "inference";
      return `| ${mdCell(factor.name)} | **${mdCell(factor.status).toUpperCase()}** | ${mdCell(factor.reason)} | ${mdCell(evidence)} |`;
    })
    .join("\n");
}

function renderHardNos(hardNos) {
  return (hardNos || [])
    .map((item) => {
      const evidence = (item.evidence_ids || []).join(", ") || "hypothesis";
      const coverage = (item.position_ids || []).join(", ");
      return `### ${mdCell(item.title)} — **${mdCell(item.severity).toUpperCase()}**

${mdCell(item.objection)}

**Why it matters:** ${mdCell(item.why_it_matters)}

**Response:** ${mdCell(item.response)}

**Evidence:** ${mdCell(evidence)} · **Coverage:** ${mdCell(coverage)}`;
    })
    .join("\n\n");
}

function renderEvidenceItems(evidence) {
  return (evidence || [])
    .map((item) => {
      const quote = item.quote ? `\n\n> ${mdCell(item.quote)}` : "";
      return `### ${mdCell(item.id)} — ${mdCell(item.source)} (${mdCell(item.type)} · ${mdCell(item.strength)})

**Observation:** ${mdCell(item.observation)}${quote}

**Implication:** ${mdCell(item.implication)}

**Source:** ${renderEvidenceReference(item)}`;
    })
    .join("\n\n");
}

function renderDimensionSummary(dimensions) {
  return (dimensions || [])
    .map((dimension) => {
      const buckets = (dimension.buckets || []).map(mdCell).join(" · ");
      return `- **${mdCell(dimension.name)}:** ${mdCell(dimension.rationale)} (${buckets})`;
    })
    .join("\n");
}

function renderPositionValues(position) {
  return Object.entries(position.dimension_values || {})
    .map(([name, value]) => `- **${mdCell(name)}:** ${mdCell(value)}`)
    .join("\n");
}

function renderPositions(positions) {
  return (positions || [])
    .map((position) => {
      const evidence = (position.evidence_ids || []).join(", ") || "hypothesis";
      const note = position.coherence_note ? `\n\n> **Note:** ${mdCell(position.coherence_note)}` : "";
      return `### ${mdCell(position.id)} — ${mdCell(position.label)} · **${mdCell(position.stance).toUpperCase()}**

**Conditions:**

${renderPositionValues(position)}

**Objection:** ${mdCell(position.objection)}

**Proof trigger:** ${mdCell(position.proof_trigger)}

**Evidence:** ${mdCell(evidence)}${note}`;
    })
    .join("\n\n");
}

function shareValue(value) {
  return mdCell(String(value ?? "").replace(/`+/g, ""));
}

function renderShareSnippet(report) {
  const recommendation = report.recommendation || {};
  const nextAction = report.next_action || {};
  return `${shareValue(report.title)}
Verdict: ${shareValue(recommendation.verdict)} (${shareValue(recommendation.confidence)} confidence)
Why: ${shareValue(recommendation.decisive_reason)}
Next: ${shareValue(nextAction.action)}`;
}

export function renderReportMarkdown(report) {
  const input = report.input || {};
  const recommendation = report.recommendation || {};
  const nextAction = report.next_action || {};
  const price = input.price ? sentence(input.price) : "Not specified.";
  const evidenceItems = renderEvidenceItems(report.evidence);
  const contradictionNote = recommendation.contradiction_note
    ? `\n\n> **Why this is not Do not build:** ${mdCell(recommendation.contradiction_note)}`
    : "";

  return `# ${mdCell(report.title)}

A pre-build decision memo that searches systematically for the strongest reasons this idea could fail.

**Grounding:** ${mdCell(report.grounding_mode)} · **Idea type:** ${mdCell(report.idea_type)} · **Coverage:** Halton sequence · ${SAMPLE_COUNT} positions · **Created:** ${mdCell(report.created_at)}

## TL;DR

${mdCell(report.tldr)}

**Share this verdict**

\`\`\`text
${renderShareSnippet(report)}
\`\`\`

## Product Snapshot

${mdCell(sentence(report.normalized_idea))}

- **First user:** ${mdCell(input.target_user)}
- **Use moment:** ${mdCell(input.use_case)}
- **Current alternative:** ${mdCell(input.current_alternative)}
- **Price:** ${mdCell(price)}

## Decision

**Verdict: ${mdCell(recommendation.verdict)}** — ${mdCell(recommendation.decisive_reason)}${contradictionNote}

Confidence: ${mdCell(recommendation.confidence)} · confidence describes the evidence, not startup success.

| Decision factor | Status | Reason | Evidence |
| --- | --- | --- | --- |
${renderFactorRows(report.decision_factors)}

## Hard Nos

${renderHardNos(report.hard_nos)}

## Evidence and Limits

Evidence base: ${renderEvidenceMix(report.evidence)}${evidenceItems ? `\n\n${evidenceItems}` : ""}

### Limits

${renderList(recommendation.evidence_limits)}

## Adversarial Coverage

Six domain-specific dimensions generate ${SAMPLE_COUNT} deterministic reasoning positions. These are structured counterpositions, not customers, probabilities, or market votes.

${renderDimensionSummary(report.adversarial_dimensions)}

${renderPositions(report.adversarial_positions)}

## What Would Change the Decision

${renderList(recommendation.reversal_evidence)}

## Building Anyway? Avoid These Mistakes

${renderList(report.mistakes_to_avoid)}

## Do This Now

**Action:** ${mdCell(nextAction.action)}

**Why now:** ${mdCell(nextAction.why_now)}

**Why this segment:** ${mdCell(nextAction.segment_rationale)}

**Recruiting channel:** ${mdCell(nextAction.recruiting_channel)}

**Success threshold:** ${mdCell(nextAction.success_threshold)}

**Kill threshold:** ${mdCell(nextAction.kill_threshold)}
`;
}

export async function renderReportFile(inputPath, outputPath = null) {
  const startedAt = performance.now();
  const report = JSON.parse(await readFile(inputPath, "utf8"));
  const markdown = renderReportMarkdown(report);
  const finalOutputPath = outputPath || path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.md`);
  await writeFile(finalOutputPath, markdown, "utf8");
  return {
    output: finalOutputPath,
    bytes: Buffer.byteLength(markdown),
    elapsed_ms: elapsedMs(startedAt),
  };
}

runCli(
  import.meta.url,
  "Usage: node report-markdown-renderer.mjs <report.json> [report.md]",
  async (inputPath, outputPath) => {
    console.log(JSON.stringify(await renderReportFile(inputPath, outputPath), null, 2));
  },
);
