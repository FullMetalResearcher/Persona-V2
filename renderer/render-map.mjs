#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const WIDTH = 1200;
const HEIGHT = 760;
const TOP = 170;
const BOTTOM = 620;
const MAX_PERSONAS = 12;

const VERDICTS = ["WOULD_PAY", "NEEDS_PROOF", "HARD_NO"];

const LANES = {
  WOULD_PAY: {
    x: 220,
    title: "WOULD_PAY",
    note: "Act now",
  },
  NEEDS_PROOF: {
    x: 600,
    title: "NEEDS_PROOF",
    note: "Requires proof",
  },
  HARD_NO: {
    x: 980,
    title: "HARD_NO",
    note: "Rejects",
  },
};

function usage() {
  return "Usage: node renderer/render-map.mjs <persona-report.json> <persona-map.svg>";
}

function fail(message) {
  console.error(`Persona map renderer: ${message}`);
  console.error(usage());
  process.exit(1);
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

async function readReport(jsonPath) {
  let raw;
  try {
    raw = await readFile(jsonPath, "utf8");
  } catch (error) {
    fail(`could not read JSON file "${jsonPath}": ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`invalid JSON in "${jsonPath}": ${error.message}`);
  }
}

function normalizePersonas(report) {
  if (!Array.isArray(report.personas) || report.personas.length === 0) {
    fail("report must include a non-empty personas array");
  }

  return report.personas.slice(0, MAX_PERSONAS).map((persona, index) => {
    const fallbackId = `P${String(index + 1).padStart(2, "0")}`;
    const id = typeof persona.id === "string" && persona.id.trim() ? persona.id.trim() : fallbackId;
    const label =
      typeof persona.label === "string" && persona.label.trim() ? persona.label.trim() : "Sampled position";
    const verdict = typeof persona.verdict === "string" ? persona.verdict.trim() : "";

    if (!VERDICTS.includes(verdict)) {
      fail(`persona ${id} has invalid verdict "${verdict}"`);
    }

    const mapPosition = persona.map_position;
    const hasMapPosition =
      mapPosition &&
      isFiniteNumber(mapPosition.x) &&
      isFiniteNumber(mapPosition.y);

    return {
      id,
      label,
      verdict,
      mapPosition: hasMapPosition
        ? {
            x: clamp(mapPosition.x, 0, 1),
            y: clamp(mapPosition.y, 0, 1),
          }
        : null,
    };
  });
}

function positionFromMap(persona) {
  return {
    ...persona,
    x: 120 + persona.mapPosition.x * (WIDTH - 240),
    y: 150 + persona.mapPosition.y * (HEIGHT - 250),
  };
}

function positionInVerdictLanes(personas) {
  const grouped = Object.fromEntries(VERDICTS.map((verdict) => [verdict, []]));

  for (const persona of personas) {
    grouped[persona.verdict].push(persona);
  }

  const positioned = [];

  for (const verdict of VERDICTS) {
    const lane = LANES[verdict];
    const group = grouped[verdict];
    const columns = group.length > 6 ? 2 : 1;
    const rows = Math.ceil(group.length / columns);
    const step = rows > 1 ? (BOTTOM - TOP) / (rows - 1) : 0;
    const offsets = columns === 1 ? [0] : [-58, 58];

    group.forEach((persona, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      positioned.push({
        ...persona,
        x: lane.x + offsets[column],
        y: rows === 1 ? (TOP + BOTTOM) / 2 : TOP + row * step,
      });
    });
  }

  return positioned.sort((a, b) => a.id.localeCompare(b.id));
}

function positionPersonas(personas) {
  if (personas.every((persona) => persona.mapPosition)) {
    return personas.map(positionFromMap);
  }

  return positionInVerdictLanes(personas);
}

function silhouetteShape(fill, stroke = "none") {
  return `
    <circle cx="0" cy="-28" r="13" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <path d="M -28 24 C -23 -6 -13 -14 0 -14 C 13 -14 23 -6 28 24 Z" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
}

function renderMark(persona) {
  const label = escapeXml(persona.id);
  const title = escapeXml(persona.label);

  let mark;

  if (persona.verdict === "WOULD_PAY") {
    mark = silhouetteShape("#111");
  } else if (persona.verdict === "NEEDS_PROOF") {
    mark = `
      ${silhouetteShape("#fff", "#111")}
      <line x1="-18" y1="22" x2="18" y2="-38" stroke="#111" stroke-width="3" stroke-linecap="round"/>
      <circle cx="18" cy="-38" r="3" fill="#111"/>`;
  } else {
    mark = `
      ${silhouetteShape("#111")}
      <line x1="-23" y1="-41" x2="23" y2="23" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
      <line x1="23" y1="-41" x2="-23" y2="23" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
      <line x1="-23" y1="-41" x2="23" y2="23" stroke="#111" stroke-width="2" stroke-linecap="round"/>
      <line x1="23" y1="-41" x2="-23" y2="23" stroke="#111" stroke-width="2" stroke-linecap="round"/>`;
  }

  return `
    <g transform="translate(${persona.x.toFixed(1)} ${persona.y.toFixed(1)})">
      <title>${title}</title>
      ${mark}
      <text x="0" y="49" text-anchor="middle" class="id-label">${label}</text>
    </g>`;
}

function renderLaneGuides() {
  return VERDICTS.map((verdict) => {
    const lane = LANES[verdict];
    return `
      <g>
        <line x1="${lane.x}" y1="120" x2="${lane.x}" y2="650" class="lane-line"/>
        <text x="${lane.x}" y="102" text-anchor="middle" class="lane-title">${escapeXml(lane.title)}</text>
        <text x="${lane.x}" y="124" text-anchor="middle" class="lane-note">${escapeXml(lane.note)}</text>
      </g>`;
  }).join("\n");
}

function renderLegend() {
  const items = [
    { verdict: "WOULD_PAY", x: 330, label: "solid = WOULD_PAY" },
    { verdict: "NEEDS_PROOF", x: 575, label: "outline/split = NEEDS_PROOF" },
    { verdict: "HARD_NO", x: 860, label: "X = HARD_NO" },
  ];

  return `
    <g transform="translate(0 704)">
      <line x1="90" y1="-28" x2="1110" y2="-28" class="rule"/>
      ${items
        .map(
          (item) => `
        <g transform="translate(${item.x} 0) scale(0.42)">
          ${renderMark({ id: "", label: item.label, verdict: item.verdict, x: 0, y: 0 })}
        </g>
        <text x="${item.x + 25}" y="4" class="legend-label">${escapeXml(item.label)}</text>`
        )
        .join("\n")}
    </g>`;
}

function renderSvg(report, personas) {
  const title = report.title || "Persona Sampling Map";
  const escapedTitle = escapeXml(title);
  const ideaType = escapeXml(report.idea_type || "unknown");
  const grounding = escapeXml(report.grounding_mode || "unknown");
  const samplingMethod = escapeXml(report.sampling_method || "legacy");
  const positionSource = personas.every((persona) => persona.mapPosition)
    ? "report map_position"
    : "verdict lane fallback";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc">
  <title id="title">Persona Sampling Map - ${escapedTitle}</title>
  <desc id="desc">A black-and-white Persona map with sampled market positions grouped by verdict.</desc>
  <style>
    text { font-family: Arial, Helvetica, sans-serif; fill: #111; }
    .title { font-size: 28px; font-weight: 700; }
    .meta { font-size: 14px; fill: #333; }
    .lane-title { font-size: 18px; font-weight: 700; }
    .lane-note { font-size: 13px; fill: #444; }
    .id-label { font-size: 13px; font-weight: 700; }
    .legend-label { font-size: 13px; fill: #222; }
    .lane-line { stroke: #d8d8d8; stroke-width: 2; stroke-dasharray: 5 7; }
    .rule { stroke: #111; stroke-width: 1; }
    .frame { fill: #fff; stroke: #111; stroke-width: 2; }
  </style>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
  <rect x="36" y="36" width="${WIDTH - 72}" height="${HEIGHT - 72}" rx="0" class="frame"/>
  <text x="70" y="78" class="title">${escapedTitle}</text>
  <text x="70" y="106" class="meta">Idea type: ${ideaType}   Grounding: ${grounding}   Sampling: ${samplingMethod}   Positions: ${escapeXml(positionSource)}</text>
  ${renderLaneGuides()}
  ${personas.map(renderMark).join("\n")}
  ${renderLegend()}
</svg>
`;
}

async function main() {
  const [, , inputPath, outputPath] = process.argv;

  if (!inputPath || !outputPath) {
    fail("missing input or output path");
  }

  const report = await readReport(inputPath);
  const personas = positionPersonas(normalizePersonas(report));
  const svg = renderSvg(report, personas);

  try {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, svg, "utf8");
  } catch (error) {
    fail(`could not write SVG file "${outputPath}": ${error.message}`);
  }

  console.log(`Wrote ${outputPath}`);
}

main();
