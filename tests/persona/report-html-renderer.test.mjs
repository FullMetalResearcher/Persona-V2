import assert from "node:assert/strict";
import test from "node:test";

import { renderReportHtml } from "../../plugins/persona/skills/persona/scripts/report-html-renderer.mjs";
import { UNSAFE_URLS, loadGoldenHtml, loadGoldenReport } from "./test-helpers.mjs";

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
    const html = renderReportHtml(report);
    assert.doesNotMatch(html, /<a href=/);
    assert.doesNotMatch(html, /<script\b|<img\b|<svg\b|onerror\s*=|onload\s*=/i);
    assert.match(html, /Source &lt;unsafe&gt; &amp; &quot;quoted&quot;/);
  }
});

test("renders valid HTTP and HTTPS evidence links", async () => {
  const golden = await loadGoldenReport();
  golden.evidence = [
    { ...golden.evidence[0], id: "E01", url: "http://example.com/a" },
    { ...golden.evidence[1], id: "E02", url: "https://example.com/b?q=1" },
  ];
  const html = renderReportHtml(golden);
  assert.match(html, /href="http:\/\/example\.com\/a" rel="noopener noreferrer"/);
  assert.match(html, /href="https:\/\/example\.com\/b\?q=1" rel="noopener noreferrer"/);
});

test("renders the tldr first with a shareable verdict", async () => {
  const report = await loadGoldenReport();
  const html = renderReportHtml(report);

  assert.ok(html.indexOf('id="tldr"') < html.indexOf('id="product-snapshot"'));
  assert.match(html, /<pre class="share-snippet"[^>]*>[\s\S]*Verdict: Build \(medium confidence\)/);
  assert.ok(html.includes(`Next: ${report.next_action.action}`));
});

test("escapes tldr content", async () => {
  const report = await loadGoldenReport();
  report.tldr = `Stop <script>alert("x")</script> & test.`;

  const html = renderReportHtml(report);
  assert.doesNotMatch(html, /<script\b/i);
  assert.match(html, /Stop &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; &amp; test\./);
});

test("escapes every user and model-controlled rendered field category", async () => {
  const report = await loadGoldenReport();
  const payload = `x\"><script data-pwned="&">alert('x')</script>`;

  for (const field of ["title", "normalized_idea", "tldr", "grounding_mode", "idea_type", "created_at"]) report[field] = payload;
  for (const field of ["target_user", "use_case", "current_alternative", "price"]) report.input[field] = payload;

  const evidence = report.evidence[0];
  for (const field of ["id", "source", "observation", "implication", "type", "strength"]) evidence[field] = payload;
  evidence.url = "javascript:<script>alert(1)</script>";

  const dimension = report.adversarial_dimensions[0];
  dimension.name = payload;
  dimension.rationale = payload;
  dimension.buckets[0] = payload;

  const position = report.adversarial_positions[0];
  for (const field of ["id", "label", "stance", "objection", "proof_trigger"]) position[field] = payload;
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
  for (const field of ["verdict", "confidence", "decisive_reason"]) recommendation[field] = payload;
  recommendation.evidence_limits = [payload];
  recommendation.reversal_evidence = [payload];
  report.mistakes_to_avoid = [payload];
  for (const field of ["action", "why_now", "success_threshold", "kill_threshold"]) report.next_action[field] = payload;

  const html = renderReportHtml(report);
  assert.doesNotMatch(html, /<script\b|data-pwned="|alert\('x'\)/i);
  assert.match(html, /&lt;script data-pwned=&quot;&amp;&quot;&gt;/);
});

test("preserves the committed golden HTML for valid URLs", async () => {
  const report = await loadGoldenReport();
  assert.equal(renderReportHtml(report), await loadGoldenHtml());
});
