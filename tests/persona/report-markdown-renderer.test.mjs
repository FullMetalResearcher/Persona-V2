import assert from "node:assert/strict";
import test from "node:test";

import {
  mdCell,
  mdText,
  renderReportMarkdown,
} from "../../plugins/persona/skills/persona/scripts/report-markdown-renderer.mjs";
import { UNSAFE_URLS, loadGoldenMarkdown, loadGoldenReport } from "./test-helpers.mjs";

function countUnescapedPipes(line) {
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] !== "|") continue;
    let backslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && line[cursor] === "\\"; cursor -= 1) backslashes += 1;
    if (backslashes % 2 === 0) count += 1;
  }
  return count;
}

test("escapes Markdown text and table cells", () => {
  assert.equal(
    mdText("a\\b `*_[]#| <tag>"),
    "a\\\\b \\`\\*\\_\\[\\]\\#\\| &lt;tag&gt;",
  );
  assert.equal(mdCell(" a |\n\t b "), "a \\| b");
});

test("renders unsafe evidence URLs as escaped plain source text", async () => {
  const golden = await loadGoldenReport();
  const unsafe = [
    ...UNSAFE_URLS,
    "data:text/html,<svg onload=alert(1)>",
    "\"><img src=x onerror=alert(1)>",
    "&quot;><script>alert(1)</script>",
  ];

  for (const url of unsafe) {
    const report = structuredClone(golden);
    report.evidence = [{
      ...report.evidence[0],
      source: "Source <unsafe> & \"quoted\"",
      url,
    }];
    const markdown = renderReportMarkdown(report);
    assert.doesNotMatch(markdown, /\]\(<[^>]+>\)/);
    assert.doesNotMatch(markdown, /<script\b|<img\b|<svg\b|onerror\s*=|onload\s*=/i);
    assert.match(markdown, /Source &lt;unsafe&gt; & "quoted"/);
  }
});

test("renders valid HTTP and HTTPS evidence links", async () => {
  const golden = await loadGoldenReport();
  golden.evidence = [
    { ...golden.evidence[0], id: "E01", url: "http://example.com/a" },
    { ...golden.evidence[1], id: "E02", url: "https://example.com/b?q=1" },
  ];
  const markdown = renderReportMarkdown(golden);
  assert.match(markdown, /\[Founder-supplied paying-customer behavior\]\(<http:\/\/example\.com\/a>\)/);
  assert.match(markdown, /\[Founder-supplied recurring workflow\]\(<https:\/\/example\.com\/b\?q=1>\)/);
});

test("renders accuracy fields: access dates, quotes, notes, and action rationale", async () => {
  const report = await loadGoldenReport();
  report.evidence[0].url = "https://example.com/a";
  report.evidence[0].accessed_at = "2026-07-19";

  const markdown = renderReportMarkdown(report);
  assert.match(markdown, /accessed 2026-07-19/);
  assert.ok(markdown.includes(`> ${report.evidence[2].quote}`));
  assert.match(markdown, /Evidence base: 2 builder-supplied items, 1 behavior observation, 1 first-person account\./);
  assert.ok(markdown.includes(`> **Note:** ${report.adversarial_positions[7].coherence_note}`));
  assert.ok(markdown.includes(`**Why this segment:** ${report.next_action.segment_rationale}`));
  assert.ok(markdown.includes(`**Recruiting channel:** ${report.next_action.recruiting_channel}`));
  assert.doesNotMatch(markdown, /Why this is not Do not build:/);

  report.recommendation.contradiction_note = "Contradicted only as scoped; a narrower wedge remains.";
  const withNote = renderReportMarkdown(report);
  assert.ok(withNote.includes("> **Why this is not Do not build:** Contradicted only as scoped; a narrower wedge remains."));
});

test("renders the TL;DR first with a fenced shareable verdict", async () => {
  const report = await loadGoldenReport();
  const markdown = renderReportMarkdown(report);

  assert.ok(markdown.indexOf("## TL;DR") < markdown.indexOf("## Product Snapshot"));
  assert.match(markdown, /```text\n[\s\S]*Verdict: Build \(medium confidence\)[\s\S]*\n```/);
  assert.ok(markdown.includes(`Next: ${report.next_action.action}`));
});

test("neutralizes Markdown and raw-HTML injection in every rendered field category", async () => {
  const report = await loadGoldenReport();
  const payload = "| ```\n# * _ [x](javascript:alert(1)) <script>alert(1)</script> <img onerror=x>";

  for (const field of ["title", "normalized_idea", "tldr", "grounding_mode", "idea_type", "created_at"]) report[field] = payload;
  for (const field of ["target_user", "use_case", "current_alternative", "price"]) report.input[field] = payload;

  const evidence = report.evidence[0];
  for (const field of ["id", "source", "observation", "implication", "type", "strength", "accessed_at", "quote"]) evidence[field] = payload;
  evidence.url = "javascript:<script>alert(1)</script>";

  const dimension = report.adversarial_dimensions[0];
  dimension.name = payload;
  dimension.rationale = payload;
  dimension.buckets[0] = payload;

  const position = report.adversarial_positions[0];
  for (const field of ["id", "label", "stance", "objection", "proof_trigger", "coherence_note"]) position[field] = payload;
  position.dimension_values = { [payload]: payload };
  position.evidence_ids = [payload];

  const factor = report.decision_factors[0];
  for (const field of ["name", "status", "reason"]) factor[field] = payload;
  factor.evidence_ids = [payload];

  const hardNo = report.hard_nos[0];
  for (const field of ["title", "objection", "why_it_matters", "severity", "response"]) hardNo[field] = payload;
  hardNo.evidence_ids = [payload];
  hardNo.position_ids = [payload];

  const recommendation = report.recommendation;
  for (const field of ["verdict", "confidence", "decisive_reason", "contradiction_note"]) recommendation[field] = payload;
  recommendation.evidence_limits = [payload];
  recommendation.reversal_evidence = [payload];
  report.mistakes_to_avoid = [payload];
  for (const field of ["action", "why_now", "success_threshold", "kill_threshold", "segment_rationale", "recruiting_channel"]) report.next_action[field] = payload;

  const markdown = renderReportMarkdown(report);
  assert.doesNotMatch(markdown, /<[a-zA-Z!\/]/);
  assert.doesNotMatch(markdown, /\]\(<javascript:/i);
  assert.equal(markdown.match(/^```/gm)?.length, 2, "interpolated values must not add fences");

  const tableRows = markdown.split("\n").filter((line) => line.startsWith("|"));
  const delimiterCount = countUnescapedPipes(tableRows[0]);
  assert.ok(tableRows.length > 2);
  tableRows.forEach((line) => assert.equal(countUnescapedPipes(line), delimiterCount));
});

test("preserves the committed golden Markdown", async () => {
  const report = await loadGoldenReport();
  const markdown = renderReportMarkdown(report);
  assert.equal(markdown, await loadGoldenMarkdown());
  assert.ok(markdown.endsWith("\n"));
  assert.ok(!markdown.endsWith("\n\n"));
});
