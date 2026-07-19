import { readFile } from "node:fs/promises";

const GOLDEN_REPORT_URL = new URL("./fixtures/generic-report.json", import.meta.url);
const GOLDEN_HTML_URL = new URL("./fixtures/generic-report.html", import.meta.url);

export const UNSAFE_URLS = [
  "javascript:alert(document.domain)",
  "data:text/html,<h1>x</h1>",
  "file:///etc/passwd",
  " JaVaScRiPt:alert(1)",
  "java\nscript:alert(1)",
  "https://example.com/space here",
];

export async function loadGoldenReport() {
  return JSON.parse(await readFile(GOLDEN_REPORT_URL, "utf8"));
}

export async function loadGoldenHtml() {
  return readFile(GOLDEN_HTML_URL, "utf8");
}

export function makeUngrounded(report) {
  report.grounding_mode = "ungrounded";
  report.evidence = [];
  report.adversarial_positions.forEach((position) => {
    position.evidence_ids = [];
  });
  report.decision_factors.forEach((factor) => {
    factor.evidence_ids = [];
  });
  report.hard_nos.forEach((hardNo) => {
    hardNo.evidence_ids = [];
  });
  report.recommendation.verdict = "Test first";
  report.recommendation.confidence = "low";
  return report;
}
