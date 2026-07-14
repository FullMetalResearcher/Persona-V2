import assert from "node:assert/strict";
import test from "node:test";

import { validateHtml, validateReportObject } from "../../plugins/persona/skills/persona/scripts/check-report.mjs";
import { renderReportHtml } from "../../plugins/persona/skills/persona/scripts/report-html-renderer.mjs";
import { clone, loadGoldenReport, makeUngrounded } from "./test-helpers.mjs";

function assertValid(report, message = "report should be valid") {
  const result = validateReportObject(report);
  assert.deepEqual(result.errors, [], `${message}:\n${result.errors.join("\n")}`);
}

function assertInvalid(report, pattern) {
  const result = validateReportObject(report);
  assert.ok(result.errors.length > 0, "report should be invalid");
  if (pattern) {
    assert.match(result.errors.join("\n"), pattern);
  }
}

test("accepts valid reports in all grounding modes", async () => {
  const golden = await loadGoldenReport();
  assertValid(golden, "user-provided");

  const webGrounded = clone(golden);
  webGrounded.grounding_mode = "web-grounded";
  webGrounded.evidence.forEach((item, index) => {
    item.url = `https://example.com/evidence-${index + 1}`;
  });
  assertValid(webGrounded, "web-grounded");

  assertValid(makeUngrounded(clone(golden)), "ungrounded");
});

test("requires a plain-language tldr", async () => {
  const golden = await loadGoldenReport();

  const missing = clone(golden);
  delete missing.tldr;
  assertInvalid(missing, /Missing top-level field: tldr/);

  for (const jargon of ["Halton", "adversarial", "counterposition", "grounded"]) {
    const report = clone(golden);
    report.tldr = `This ${jargon} analysis recommends Build.`;
    assertInvalid(report, /tldr must use plain language without method jargon/);
  }
});

test("rejects invalid and unsafe input and evidence URLs", async () => {
  const golden = await loadGoldenReport();
  const unsafe = [
    "javascript:alert(document.domain)",
    "data:text/html,<h1>x</h1>",
    "file:///etc/passwd",
    " JaVaScRiPt:alert(1)",
    "java\nscript:alert(1)",
    "https://example.com/space here",
  ];

  for (const url of unsafe) {
    const evidenceReport = clone(golden);
    evidenceReport.evidence[0].url = url;
    assertInvalid(evidenceReport, /evidence\[0\]\.url must be an absolute HTTP\(S\) URL/);

    const inputReport = clone(golden);
    inputReport.input.links = [url];
    assertInvalid(inputReport, /input\.links\[0\] must be an absolute HTTP\(S\) URL/);
  }

  for (const url of ["http://example.com/path", "HTTPS://example.com/path?q=1"] ) {
    const report = clone(golden);
    report.input.links = [url];
    report.evidence[0].url = url;
    assertValid(report);
  }

  const wrongType = clone(golden);
  wrongType.input.links = [42];
  assertInvalid(wrongType, /input\.links\[0\]/);
});

test("rejects unknown fields in every fixed nested object", async () => {
  const golden = await loadGoldenReport();
  const targets = [
    ["input", (report) => report.input],
    ["evidence", (report) => report.evidence[0]],
    ["adversarial_dimensions", (report) => report.adversarial_dimensions[0]],
    ["adversarial_positions", (report) => report.adversarial_positions[0]],
    ["decision_factors", (report) => report.decision_factors[0]],
    ["hard_nos", (report) => report.hard_nos[0]],
    ["recommendation", (report) => report.recommendation],
    ["next_action", (report) => report.next_action],
  ];

  for (const [label, select] of targets) {
    const report = clone(golden);
    select(report).unexpected = true;
    assertInvalid(report, /Unknown .* field: unexpected/);
  }
});

test("rejects missing required fields in every fixed nested object", async () => {
  const golden = await loadGoldenReport();
  const targets = [
    [(report) => report.input, "idea"],
    [(report) => report.evidence[0], "source"],
    [(report) => report.adversarial_dimensions[0], "rationale"],
    [(report) => report.adversarial_positions[0], "proof_trigger"],
    [(report) => report.decision_factors[0], "reason"],
    [(report) => report.hard_nos[0], "response"],
    [(report) => report.recommendation, "evidence_limits"],
    [(report) => report.next_action, "kill_threshold"],
  ];

  for (const [select, field] of targets) {
    const report = clone(golden);
    delete select(report)[field];
    assertInvalid(report, new RegExp(`${field} is required|${field} must`));
  }
});

test("rejects malformed arrays, wrong item types, and duplicate items", async () => {
  const golden = await loadGoldenReport();

  const malformed = clone(golden);
  malformed.mistakes_to_avoid = "not an array";
  assertInvalid(malformed, /mistakes_to_avoid must contain 3-5 items/);

  const wrongReferenceType = clone(golden);
  wrongReferenceType.decision_factors[0].evidence_ids = [42];
  assertInvalid(wrongReferenceType, /must be a non-empty string/);

  const duplicateLinks = clone(golden);
  duplicateLinks.input.links = ["https://example.com/a", "https://example.com/a"];
  assertInvalid(duplicateLinks, /input\.links must not contain duplicate items/);

  const duplicateStrings = clone(golden);
  duplicateStrings.recommendation.evidence_limits = ["same", "same"];
  assertInvalid(duplicateStrings, /recommendation\.evidence_limits must not contain duplicate items/);

  const duplicateObjects = clone(golden);
  duplicateObjects.decision_factors[1] = clone(duplicateObjects.decision_factors[0]);
  assertInvalid(duplicateObjects, /decision_factors must not contain duplicate items/);
});

test("rejects duplicate, missing, and unresolved evidence and position IDs", async () => {
  const golden = await loadGoldenReport();

  const duplicateEvidence = clone(golden);
  duplicateEvidence.evidence[1].id = "E01";
  assertInvalid(duplicateEvidence, /Duplicate evidence id/);

  const missingEvidence = clone(golden);
  missingEvidence.evidence[1].id = "E09";
  assertInvalid(missingEvidence, /evidence\[1\]\.id must be E02/);

  const unresolvedEvidence = clone(golden);
  unresolvedEvidence.adversarial_positions[0].evidence_ids = ["E99"];
  assertInvalid(unresolvedEvidence, /references unknown id: E99/);

  const emptyEvidenceReferences = clone(golden);
  emptyEvidenceReferences.hard_nos[0].evidence_ids = [];
  assertInvalid(emptyEvidenceReferences, /must contain at least one reference/);

  const duplicatePosition = clone(golden);
  duplicatePosition.adversarial_positions[1].id = "A01";
  assertInvalid(duplicatePosition, /Duplicate position id/);

  const unresolvedPosition = clone(golden);
  unresolvedPosition.hard_nos[0].position_ids = ["A99"];
  assertInvalid(unresolvedPosition, /references unknown id: A99/);
});

test("rejects invalid sampling coordinates and dimension values", async () => {
  const golden = await loadGoldenReport();
  const firstDimension = golden.adversarial_dimensions[0].name;

  const coordinate = clone(golden);
  coordinate.adversarial_positions[0].sampling_coordinates[firstDimension] = 1;
  assertInvalid(coordinate, /does not match deterministic Halton sampling/);

  const dimensionValue = clone(golden);
  dimensionValue.adversarial_positions[0].dimension_values[firstDimension] = "invented bucket";
  assertInvalid(dimensionValue, /does not match deterministic Halton sampling/);

  const extraKey = clone(golden);
  extraKey.adversarial_positions[0].sampling_coordinates.extra = 0.5;
  assertInvalid(extraKey, /keys must match adversarial_dimensions in order/);
});

test("rejects invalid dates and verdict-confidence combinations", async () => {
  const golden = await loadGoldenReport();

  const invalidLanguage = clone(golden);
  invalidLanguage.language = "e";
  assertInvalid(invalidLanguage, /language must be a string with at least 2 characters/);

  const invalidDate = clone(golden);
  invalidDate.created_at = "2026-02-30";
  assertInvalid(invalidDate, /real calendar date/);

  const highUngrounded = makeUngrounded(clone(golden));
  highUngrounded.recommendation.confidence = "high";
  assertInvalid(highUngrounded, /ungrounded reports must use.*low/);

  const buildWithoutDemand = clone(golden);
  buildWithoutDemand.recommendation.verdict = "Build";
  buildWithoutDemand.evidence.forEach((item) => {
    item.type = "alternative";
  });
  assertInvalid(buildWithoutDemand, /Build requires direct/);

  const buildWithFatal = clone(golden);
  buildWithFatal.recommendation.verdict = "Build";
  buildWithFatal.hard_nos[0].severity = "fatal";
  assertInvalid(buildWithFatal, /Build cannot have an unresolved fatal Hard No/);
});

test("enforces the Do not build structural-failure gate", async () => {
  const report = await loadGoldenReport();
  report.recommendation.verdict = "Do not build";
  report.decision_factors.forEach((factor) => {
    factor.status = "uncertain";
  });
  report.hard_nos.forEach((hardNo) => {
    hardNo.severity = "major";
  });
  assertInvalid(report, /Do not build requires a fatal Hard No or contradicted decision factor/);

  report.hard_nos[0].severity = "fatal";
  assertValid(report);
});

test("accepts the bundled renderer output as safe and complete HTML", async () => {
  const report = await loadGoldenReport();
  const html = renderReportHtml(report);
  const result = validateHtml(
    html,
    report,
    "reports/example-2026-07-12.json",
    "reports/example-2026-07-12.html",
  );

  assert.deepEqual(result.errors, []);
});

test("rejects incomplete, active, external, obsolete, and mismatched HTML", async () => {
  const report = await loadGoldenReport();
  const html = renderReportHtml(report);
  const unsafeVariants = [
    [html.replace("<!doctype html>", ""), /must start with <!doctype html>/],
    [html.replace('id="tldr"', 'id="removed-tldr"'), /missing section id: tldr/],
    [html.replace('class="share-snippet"', 'class="removed-share-snippet"'), /must include a shareable verdict snippet/],
    [html.replace("Verdict: Build (medium confidence)", "Verdict: Test first (low confidence)"), /must include the report verdict and confidence/],
    [html.replace('id="hard-nos"', 'id="removed-hard-nos"'), /missing section id: hard-nos/],
    [html.replace("</body>", "<script>alert(1)</script></body>"), /must not include JavaScript/],
    [html.replace("</head>", '<link rel="stylesheet" href="https://example.com/x.css"></head>'), /must not include external link tags/],
    [html.replace("</body>", '<img src="https://example.com/x.png"></body>'), /must not include external assets/],
    [html.replace("</style>", "@import url(https://example.com/x.css);</style>"), /must not import remote CSS/],
    [html.replace("</body>", "<p>12 / 12</p></body>"), /must not present sampled positions as a vote tally/],
    [html.replace("</body>", "<p>WOULD_PAY</p></body>"), /contains obsolete persona or purchase-verdict language/],
  ];

  for (const [candidate, expectedError] of unsafeVariants) {
    assert.match(validateHtml(candidate, report).errors.join("\n"), expectedError);
  }

  assert.match(
    validateHtml(html, report, "reports/one.json", "reports/two.html").errors.join("\n"),
    /filenames must use the same slug\/date suffix/,
  );
});
