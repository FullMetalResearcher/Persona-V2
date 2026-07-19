import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { elapsedMs, normalizeHttpUrl, runCli } from "./lib.mjs";
import { SAMPLE_COUNT } from "./halton-sampler.mjs";

const HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => HTML_ESCAPE[character]);
}

function sentence(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function renderList(items) {
  const content = (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
  return `<ul>${content}</ul>`;
}

function renderEvidenceReference(item) {
  const safeUrl = normalizeHttpUrl(item.url);
  const source = escapeHtml(item.source);
  const accessed = item.accessed_at ? `<br><span class="quiet">accessed ${escapeHtml(item.accessed_at)}</span>` : "";
  if (!safeUrl) return `${source}${accessed}`;
  return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${source}</a>${accessed}`;
}

function renderEvidenceRows(evidence) {
  return (evidence || [])
    .map(
      (item) => `<tr>
        <td><code>${escapeHtml(item.id)}</code><br><span class="quiet">${escapeHtml(item.type)} · ${escapeHtml(item.strength)}</span></td>
        <td>${escapeHtml(item.observation)}${item.quote ? `<br><span class="quiet evidence-quote">“${escapeHtml(item.quote)}”</span>` : ""}</td>
        <td>${escapeHtml(item.implication)}</td>
        <td>${renderEvidenceReference(item)}</td>
      </tr>`,
    )
    .join("\n");
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
    const [singular, plural] = EVIDENCE_MIX_LABELS[type] || [type, type];
    return `${count} ${count === 1 ? singular : plural}`;
  });
  if (parts.length === 0) return "";
  return `<p class="quiet">Evidence base: ${escapeHtml(parts.join(", "))}.</p>`;
}

function renderFactorRows(factors) {
  return (factors || [])
    .map(
      (factor) => `<tr>
        <td>${escapeHtml(factor.name)}</td>
        <td><span class="status status-${escapeHtml(factor.status)}">${escapeHtml(factor.status)}</span></td>
        <td>${escapeHtml(factor.reason)}</td>
        <td class="refs">${escapeHtml((factor.evidence_ids || []).join(", ") || "inference")}</td>
      </tr>`,
    )
    .join("\n");
}

function renderHardNos(hardNos) {
  return (hardNos || [])
    .map(
      (item) => `<article class="hard-no">
        <div class="hard-no-heading">
          <h3>${escapeHtml(item.title)}</h3>
          <span class="severity severity-${escapeHtml(item.severity)}">${escapeHtml(item.severity)}</span>
        </div>
        <p>${escapeHtml(item.objection)}</p>
        <p class="quiet"><strong>Why it matters:</strong> ${escapeHtml(item.why_it_matters)}</p>
        <p><strong>Response:</strong> ${escapeHtml(item.response)}</p>
        <p class="refs">Evidence: ${escapeHtml((item.evidence_ids || []).join(", ") || "hypothesis")} · Coverage: ${escapeHtml((item.position_ids || []).join(", "))}</p>
      </article>`,
    )
    .join("\n");
}

function renderDimensionSummary(dimensions) {
  return (dimensions || [])
    .map(
      (dimension) => `<li><strong>${escapeHtml(dimension.name)}:</strong> ${escapeHtml(dimension.rationale)} <span class="quiet">(${escapeHtml(dimension.buckets.join(" · "))})</span></li>`,
    )
    .join("\n");
}

function renderPositionValues(position) {
  return Object.entries(position.dimension_values || {})
    .map(([name, value]) => `<span><strong>${escapeHtml(name)}:</strong> ${escapeHtml(value)}</span>`)
    .join("<br>");
}

function renderPositionRows(positions) {
  return (positions || [])
    .map(
      (position) => `<tr>
        <td><code>${escapeHtml(position.id)}</code><br><strong>${escapeHtml(position.label)}</strong></td>
        <td class="position-values">${renderPositionValues(position)}${position.coherence_note ? `<br><span class="coherence-note">Note: ${escapeHtml(position.coherence_note)}</span>` : ""}</td>
        <td><span class="stance stance-${escapeHtml(position.stance)}">${escapeHtml(position.stance)}</span><br>${escapeHtml(position.objection)}</td>
        <td>${escapeHtml(position.proof_trigger)}<br><span class="refs">${escapeHtml((position.evidence_ids || []).join(", ") || "hypothesis")}</span></td>
      </tr>`,
    )
    .join("\n");
}

function verdictClass(verdict) {
  if (verdict === "Build") return "build";
  if (verdict === "Do not build") return "do-not-build";
  return "test-first";
}

function renderShareSnippet(report) {
  const recommendation = report.recommendation || {};
  const nextAction = report.next_action || {};
  return `${escapeHtml(report.title)}
Verdict: ${escapeHtml(recommendation.verdict)} (${escapeHtml(recommendation.confidence)} confidence)
Why: ${escapeHtml(recommendation.decisive_reason)}
Next: ${escapeHtml(nextAction.action)}`;
}

export function renderReportHtml(report) {
  const input = report.input || {};
  const recommendation = report.recommendation || {};
  const nextAction = report.next_action || {};
  const language = /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(report.language || "") ? report.language : "en";
  const price = input.price ? sentence(input.price) : "Not specified.";
  const evidenceRows = renderEvidenceRows(report.evidence);

  return `<!doctype html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.title)}</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17191d;
      --muted: #626a73;
      --line: #d9dde2;
      --soft: #f5f6f7;
      --paper: #ffffff;
      --red: #a63b32;
      --red-soft: #f8eeec;
      --amber: #8b5a12;
      --amber-soft: #faf3e5;
      --green: #226a4a;
      --green-soft: #eaf5ef;
      --blue: #315f87;
    }
    * { box-sizing: border-box; }
    html { background: #eef0f2; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--paper);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 16px;
      line-height: 1.55;
      letter-spacing: 0;
    }
    main { width: min(1080px, calc(100% - 40px)); margin: 0 auto; padding: 54px 0 80px; }
    header { max-width: 900px; margin-bottom: 34px; }
    h1 { margin: 0 0 12px; font-size: 38px; line-height: 1.12; letter-spacing: 0; }
    h2 { margin: 0 0 16px; font-size: 23px; line-height: 1.25; letter-spacing: 0; }
    h3 { margin: 0; font-size: 17px; line-height: 1.35; letter-spacing: 0; }
    p { margin: 0 0 12px; max-width: 82ch; overflow-wrap: anywhere; }
    a { color: var(--blue); text-decoration-thickness: 1px; text-underline-offset: 2px; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
    section { padding: 32px 0; border-top: 1px solid var(--line); }
    .dek { color: var(--muted); font-size: 18px; max-width: 72ch; }
    .tldr-lead { border-left: 5px solid var(--ink); padding: 2px 0 2px 20px; font-size: 19px; line-height: 1.6; }
    .share-label { margin-top: 24px; font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .share-snippet { margin: 8px 0 0; border: 1px solid var(--line); background: var(--soft); padding: 16px 18px; white-space: pre-wrap; overflow-wrap: anywhere; font: 14px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .metadata { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 20px; color: var(--muted); font-size: 14px; }
    .metadata span { white-space: nowrap; }
    .metadata strong { color: var(--ink); }
    .snapshot { display: grid; grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr); gap: 32px; }
    .facts { margin: 0; }
    .facts div { padding: 8px 0; border-bottom: 1px solid var(--line); }
    .facts dt { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .facts dd { margin: 2px 0 0; }
    .decision-band { border-left: 5px solid var(--amber); background: var(--amber-soft); padding: 22px 24px; }
    .decision-band.build { border-color: var(--green); background: var(--green-soft); }
    .decision-band.test-first { border-color: var(--amber); background: var(--amber-soft); }
    .decision-band.do-not-build { border-color: var(--red); background: var(--red-soft); }
    .contradiction-note { margin: 10px 0 12px; }
    .evidence-quote, .coherence-note { font-style: italic; }
    .coherence-note { display: inline-block; margin-top: 6px; }
    .verdict { display: block; margin-bottom: 5px; font-size: 28px; font-weight: 760; }
    .confidence { color: var(--muted); font-size: 14px; }
    .table-wrap { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 11px; border: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { background: var(--soft); font-weight: 680; }
    ul { margin: 8px 0 0; padding-left: 21px; max-width: 92ch; }
    li { margin-bottom: 8px; }
    .quiet { color: var(--muted); }
    .refs { color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
    .hard-no { padding: 18px 0; border-top: 1px solid var(--line); }
    .hard-no:first-of-type { border-top: 0; padding-top: 0; }
    .hard-no-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 8px; }
    .severity, .status, .stance { display: inline-block; border: 1px solid currentColor; border-radius: 4px; padding: 2px 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .severity-fatal, .status-contradicted, .stance-reject { color: var(--red); }
    .severity-major, .status-uncertain, .stance-conditional { color: var(--amber); }
    .severity-manageable, .status-supported, .stance-support { color: var(--green); }
    .dimension-list { columns: 2; column-gap: 36px; margin-bottom: 22px; }
    .dimension-list li { break-inside: avoid; }
    .position-values { min-width: 220px; color: var(--muted); font-size: 12px; }
    .action { border-top: 4px solid var(--ink); padding-top: 22px; }
    .thresholds { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 18px; }
    .thresholds div { padding: 15px 0; border-top: 1px solid var(--line); }
    .thresholds strong { display: block; margin-bottom: 5px; }
    @media (max-width: 760px) {
      main { width: min(100% - 24px, 1080px); padding-top: 30px; }
      h1 { font-size: 30px; }
      .snapshot, .thresholds { grid-template-columns: 1fr; gap: 16px; }
      .dimension-list { columns: 1; }
      th, td { min-width: 130px; }
      .hard-no-heading { align-items: flex-start; }
    }
    @media print {
      html, body { background: #fff; }
      main { width: auto; margin: 0; padding: 0; }
      header { margin-bottom: 20px; }
      section { padding: 22px 0; }
      h2, h3 { break-after: avoid; page-break-after: avoid; }
      #tldr, .share-snippet, .decision-band, .hard-no, .thresholds div, tr { break-inside: avoid; page-break-inside: avoid; }
      .table-wrap { overflow: visible; }
      a { color: #000; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(report.title)}</h1>
      <p class="dek">A pre-build decision memo that searches systematically for the strongest reasons this idea could fail.</p>
      <div class="metadata">
        <span><strong>Grounding:</strong> <code>${escapeHtml(report.grounding_mode)}</code></span>
        <span><strong>Idea type:</strong> <code>${escapeHtml(report.idea_type)}</code></span>
        <span><strong>Coverage:</strong> <code>Halton sequence · ${SAMPLE_COUNT} positions</code></span>
        <span><strong>Created:</strong> ${escapeHtml(report.created_at)}</span>
      </div>
    </header>

    <section id="tldr">
      <h2>TL;DR</h2>
      <p class="tldr-lead">${escapeHtml(report.tldr)}</p>
      <p class="share-label">Share this verdict</p>
      <pre class="share-snippet" aria-label="Shareable verdict">${renderShareSnippet(report)}</pre>
    </section>

    <section id="product-snapshot">
      <h2>Product Snapshot</h2>
      <div class="snapshot">
        <div>
          <p>${escapeHtml(sentence(report.normalized_idea))}</p>
          <p class="quiet">This neutral formulation removes promotional framing before evidence review and adversarial coverage.</p>
        </div>
        <dl class="facts">
          <div><dt>First user</dt><dd>${escapeHtml(input.target_user)}</dd></div>
          <div><dt>Use moment</dt><dd>${escapeHtml(input.use_case)}</dd></div>
          <div><dt>Current alternative</dt><dd>${escapeHtml(input.current_alternative)}</dd></div>
          <div><dt>Price</dt><dd>${escapeHtml(price)}</dd></div>
        </dl>
      </div>
    </section>

    <section id="decision">
      <h2>Decision</h2>
      <div class="decision-band ${verdictClass(recommendation.verdict)}">
        <span class="verdict">${escapeHtml(recommendation.verdict)}</span>
        <p>${escapeHtml(recommendation.decisive_reason)}</p>${recommendation.contradiction_note ? `
        <p class="quiet contradiction-note"><strong>Why this is not Do not build:</strong> ${escapeHtml(recommendation.contradiction_note)}</p>` : ""}
        <span class="confidence">Confidence: ${escapeHtml(recommendation.confidence)} · confidence describes the evidence, not startup success.</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Decision factor</th><th>Status</th><th>Reason</th><th>Evidence</th></tr></thead>
          <tbody>${renderFactorRows(report.decision_factors)}</tbody>
        </table>
      </div>
    </section>

    <section id="hard-nos">
      <h2>Hard Nos</h2>
      ${renderHardNos(report.hard_nos)}
    </section>

    <section id="evidence-and-limits">
      <h2>Evidence and Limits</h2>
      ${evidenceRows ? `${renderEvidenceMix(report.evidence)}<div class="table-wrap"><table><thead><tr><th>ID</th><th>Observation</th><th>Implication</th><th>Source</th></tr></thead><tbody>${evidenceRows}</tbody></table></div>` : "<p>No external evidence was available. Treat every objection as a hypothesis.</p>"}
      <h3>Limits</h3>
      ${renderList(recommendation.evidence_limits)}
    </section>

    <section id="adversarial-coverage">
      <h2>Adversarial Coverage</h2>
      <p>Six domain-specific dimensions generate ${SAMPLE_COUNT} deterministic reasoning positions. These are structured counterpositions, not customers, probabilities, or market votes.</p>
      <ul class="dimension-list">${renderDimensionSummary(report.adversarial_dimensions)}</ul>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Position</th><th>Conditions</th><th>Strongest objection</th><th>Proof trigger</th></tr></thead>
          <tbody>${renderPositionRows(report.adversarial_positions)}</tbody>
        </table>
      </div>
    </section>

    <section id="what-would-change">
      <h2>What Would Change the Decision</h2>
      ${renderList(recommendation.reversal_evidence)}
    </section>

    <section id="building-anyway">
      <h2>Building Anyway? Avoid These Mistakes</h2>
      ${renderList(report.mistakes_to_avoid)}
    </section>

    <section id="do-this-now" class="action">
      <h2>Do This Now</h2>
      <p><strong>Action:</strong> ${escapeHtml(nextAction.action)}</p>
      <p><strong>Why now:</strong> ${escapeHtml(nextAction.why_now)}</p>
      <p><strong>Why this segment:</strong> ${escapeHtml(nextAction.segment_rationale)}</p>
      <p><strong>Recruiting channel:</strong> ${escapeHtml(nextAction.recruiting_channel)}</p>
      <div class="thresholds">
        <div><strong>Success threshold</strong>${escapeHtml(nextAction.success_threshold)}</div>
        <div><strong>Kill threshold</strong>${escapeHtml(nextAction.kill_threshold)}</div>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

export async function renderReportFile(inputPath, outputPath = null) {
  const startedAt = performance.now();
  const report = JSON.parse(await readFile(inputPath, "utf8"));
  const html = renderReportHtml(report);
  const finalOutputPath = outputPath || path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.html`);
  await writeFile(finalOutputPath, html, "utf8");
  return {
    output: finalOutputPath,
    bytes: Buffer.byteLength(html),
    elapsed_ms: elapsedMs(startedAt),
  };
}

runCli(
  import.meta.url,
  "Usage: node report-html-renderer.mjs <report.json> [report.html]",
  async (inputPath, outputPath) => {
    console.log(JSON.stringify(await renderReportFile(inputPath, outputPath), null, 2));
  },
);
