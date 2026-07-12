import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { sampleAdversarialPositions, validateDimensions } from "./halton-sampler.mjs";

const IDEA_TYPES = ["B2B", "B2C", "marketplace/platform"];
const GROUNDING_MODES = ["web-grounded", "user-provided", "ungrounded"];
const STANCES = ["reject", "conditional", "support"];
const FACTOR_STATUSES = ["supported", "uncertain", "contradicted"];
const SEVERITIES = ["fatal", "major", "manageable"];
const VERDICTS = ["Build", "Test first", "Do not build"];
const CONFIDENCE = ["low", "medium", "high"];
const EVIDENCE_TYPES = [
  "buyer-language",
  "current-behavior",
  "alternative",
  "switching-barrier",
  "regulation",
  "pricing",
  "user-provided",
];
const EVIDENCE_STRENGTHS = ["strong", "mixed", "weak"];
const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

const OBJECT_FIELDS = {
  input: ["idea", "target_user", "use_case", "current_alternative", "price", "links", "user_evidence"],
  evidence: ["id", "source", "url", "observation", "type", "strength", "implication"],
  dimension: ["name", "rationale", "buckets"],
  position: ["id", "label", "dimension_values", "sampling_coordinates", "stance", "objection", "proof_trigger", "evidence_ids"],
  decisionFactor: ["name", "status", "reason", "evidence_ids"],
  hardNo: ["title", "objection", "why_it_matters", "evidence_ids", "position_ids", "severity", "response"],
  recommendation: ["verdict", "confidence", "decisive_reason", "evidence_limits", "reversal_evidence"],
  nextAction: ["action", "why_now", "success_threshold", "kill_threshold"],
};

const REQUIRED_TOP_LEVEL = [
  "title",
  "slug",
  "created_at",
  "language",
  "idea_type",
  "grounding_mode",
  "input",
  "normalized_idea",
  "evidence",
  "adversarial_dimensions",
  "sampling_method",
  "adversarial_positions",
  "decision_factors",
  "hard_nos",
  "recommendation",
  "mistakes_to_avoid",
  "next_action",
];

const OBSOLETE_FIELDS = [
  "evidence_packet",
  "sampling_dimensions",
  "personas",
  "verdict_metrics",
  "objections_to_beat",
  "next_experiment",
  "pursuit_recommendation",
];

const REQUIRED_SECTIONS = [
  "product-snapshot",
  "decision",
  "hard-nos",
  "evidence-and-limits",
  "adversarial-coverage",
  "what-would-change",
  "building-anyway",
  "do-this-now",
];

const LEGACY_DIMENSION_GRIDS = [
  ["company size", "buyer role", "budget authority", "urgency", "switching pain", "trust/compliance barrier"],
  ["consumer archetype", "pain frequency", "willingness to pay", "habit strength", "trust/risk sensitivity", "channel accessibility"],
  ["supply-side motivation", "demand-side urgency", "liquidity difficulty", "trust requirement", "repeat-use likelihood", "switching friction"],
];

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sameItems(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => item === b[index]);
}

function validateObjectShape(value, field, allowedFields, errors) {
  if (!isObject(value)) {
    errors.push(`${field} must be an object`);
    return false;
  }

  allowedFields.forEach((property) => {
    if (!(property in value)) errors.push(`${field}.${property} is required`);
  });
  Object.keys(value).forEach((property) => {
    if (!allowedFields.includes(property)) errors.push(`Unknown ${field} field: ${property}`);
  });
  return true;
}

function validateUniqueItems(values, field, errors) {
  if (!Array.isArray(values)) return;
  const serialized = values.map((value) => JSON.stringify(value));
  if (new Set(serialized).size !== serialized.length) errors.push(`${field} must not contain duplicate items`);
}

function validateStringArray(values, field, errors, { min = 0, max = Infinity } = {}) {
  if (!Array.isArray(values)) {
    errors.push(`${field} must be an array`);
    return false;
  }
  if (values.length < min || values.length > max) {
    const range = max === Infinity ? `at least ${min}` : `${min}-${max}`;
    errors.push(`${field} must contain ${range} items`);
  }
  values.forEach((value, index) => {
    if (!nonEmptyString(value)) errors.push(`${field}[${index}] must be a non-empty string`);
  });
  validateUniqueItems(values, field, errors);
  return true;
}

function validateReferences(values, knownIds, field, errors, { required = false } = {}) {
  if (!Array.isArray(values)) {
    errors.push(`${field} must be an array`);
    return;
  }
  if (required && values.length === 0) errors.push(`${field} must contain at least one reference`);
  if (new Set(values).size !== values.length) errors.push(`${field} must not contain duplicate references`);
  values.forEach((id, index) => {
    if (!nonEmptyString(id)) {
      errors.push(`${field}[${index}] must be a non-empty string`);
      return;
    }
    if (!knownIds.has(id)) errors.push(`${field} references unknown id: ${id}`);
  });
}

function validateHttpUrl(value, { allowEmpty = false } = {}) {
  if (allowEmpty && value === "") return true;
  if (typeof value !== "string" || !HTTP_URL_PATTERN.test(value)) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function validateCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

export function validateReportObject(report) {
  const errors = [];
  const warnings = [];

  if (!isObject(report)) return { errors: ["report must be an object"], warnings };

  REQUIRED_TOP_LEVEL.forEach((field) => {
    if (!(field in report)) errors.push(`Missing top-level field: ${field}`);
  });
  OBSOLETE_FIELDS.forEach((field) => {
    if (field in report) errors.push(`Obsolete top-level field is not allowed: ${field}`);
  });
  Object.keys(report).forEach((field) => {
    if (!REQUIRED_TOP_LEVEL.includes(field)) errors.push(`Unknown top-level field: ${field}`);
  });

  if (!nonEmptyString(report.title)) errors.push("title must be a non-empty string");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(report.slug || "")) errors.push("slug must use lowercase English slug format");
  if (!validateCalendarDate(report.created_at)) errors.push("created_at must be a real calendar date in YYYY-MM-DD format");
  if (!nonEmptyString(report.language)) errors.push("language must be a non-empty string");
  if (!IDEA_TYPES.includes(report.idea_type)) errors.push(`idea_type must be one of: ${IDEA_TYPES.join(", ")}`);
  if (!GROUNDING_MODES.includes(report.grounding_mode)) errors.push(`grounding_mode must be one of: ${GROUNDING_MODES.join(", ")}`);
  if (!nonEmptyString(report.normalized_idea)) errors.push("normalized_idea must be a non-empty string");
  if (report.sampling_method !== "halton") errors.push('sampling_method must be "halton"');

  if (validateObjectShape(report.input, "input", OBJECT_FIELDS.input, errors)) {
    ["idea", "target_user", "use_case", "current_alternative", "user_evidence"].forEach((field) => {
      if (typeof report.input[field] !== "string" || (field !== "user_evidence" && !report.input[field].trim())) {
        errors.push(`input.${field} must be ${field === "user_evidence" ? "a string" : "a non-empty string"}`);
      }
    });
    if (!(typeof report.input.price === "string" || report.input.price === null)) errors.push("input.price must be a string or null");
    if (Array.isArray(report.input.links)) {
      validateUniqueItems(report.input.links, "input.links", errors);
      report.input.links.forEach((link, index) => {
        if (!validateHttpUrl(link)) errors.push(`input.links[${index}] must be an absolute HTTP(S) URL`);
      });
    } else {
      errors.push("input.links must be an array");
    }
  }

  const evidenceIds = new Set();
  if (!Array.isArray(report.evidence)) {
    errors.push("evidence must be an array");
  } else {
    validateUniqueItems(report.evidence, "evidence", errors);
    if (report.grounding_mode === "web-grounded" && report.evidence.length < 3) errors.push("web-grounded reports need at least 3 evidence items");
    if (report.grounding_mode === "user-provided" && report.evidence.length < 1) errors.push("user-provided reports need at least 1 evidence item");
    if (report.evidence.length > 7) errors.push("evidence must contain at most 7 items");

    report.evidence.forEach((item, index) => {
      const label = `evidence[${index}]`;
      if (!validateObjectShape(item, label, OBJECT_FIELDS.evidence, errors)) return;
      const expectedId = `E${String(index + 1).padStart(2, "0")}`;
      if (item.id !== expectedId) errors.push(`${label}.id must be ${expectedId}`);
      if (evidenceIds.has(item.id)) errors.push(`Duplicate evidence id: ${item.id}`);
      evidenceIds.add(item.id);
      ["source", "observation", "implication"].forEach((field) => {
        if (!nonEmptyString(item[field])) errors.push(`${label}.${field} must be a non-empty string`);
      });
      if (!validateHttpUrl(item.url, { allowEmpty: true })) errors.push(`${label}.url must be an absolute HTTP(S) URL or empty`);
      if (report.grounding_mode === "web-grounded" && !item.url) errors.push(`${label}.url is required for web-grounded evidence`);
      if (!EVIDENCE_TYPES.includes(item.type)) errors.push(`${label}.type must be one of: ${EVIDENCE_TYPES.join(", ")}`);
      if (!EVIDENCE_STRENGTHS.includes(item.strength)) errors.push(`${label}.strength must be one of: ${EVIDENCE_STRENGTHS.join(", ")}`);
    });
  }

  let expectedPositions = [];
  try {
    validateDimensions(report.adversarial_dimensions);
    expectedPositions = sampleAdversarialPositions(report.adversarial_dimensions);
  } catch (error) {
    errors.push(error.message);
  }

  const dimensionNames = Array.isArray(report.adversarial_dimensions)
    ? report.adversarial_dimensions.map((dimension) => dimension?.name)
    : [];
  if (LEGACY_DIMENSION_GRIDS.some((grid) => sameItems(dimensionNames, grid))) {
    errors.push("adversarial_dimensions must be domain-specific; the legacy fixed grid is not allowed");
  }
  if (Array.isArray(report.adversarial_dimensions)) {
    validateUniqueItems(report.adversarial_dimensions, "adversarial_dimensions", errors);
    report.adversarial_dimensions.forEach((dimension, index) => {
      if (!validateObjectShape(dimension, `adversarial_dimensions[${index}]`, OBJECT_FIELDS.dimension, errors)) return;
      if (!nonEmptyString(dimension?.rationale)) errors.push(`adversarial_dimensions[${index}].rationale must be a non-empty string`);
    });
  }

  const positionIds = new Set();
  const objectionTexts = new Set();
  if (!Array.isArray(report.adversarial_positions) || report.adversarial_positions.length !== 12) {
    errors.push("adversarial_positions must contain exactly 12 items");
  } else {
    validateUniqueItems(report.adversarial_positions, "adversarial_positions", errors);
    report.adversarial_positions.forEach((position, index) => {
      const label = `adversarial_positions[${index}]`;
      const expected = expectedPositions[index];
      const expectedId = `A${String(index + 1).padStart(2, "0")}`;
      if (!validateObjectShape(position, label, OBJECT_FIELDS.position, errors)) return;
      if (position.id !== expectedId) errors.push(`${label}.id must be ${expectedId}`);
      if (positionIds.has(position.id)) errors.push(`Duplicate position id: ${position.id}`);
      positionIds.add(position.id);
      if (!nonEmptyString(position.label)) errors.push(`${position.id}.label must be a non-empty string`);
      if (!STANCES.includes(position.stance)) errors.push(`${position.id}.stance must be one of: ${STANCES.join(", ")}`);
      if (!nonEmptyString(position.objection)) errors.push(`${position.id}.objection must be a non-empty string`);
      if (!nonEmptyString(position.proof_trigger)) errors.push(`${position.id}.proof_trigger must be a non-empty string`);

      if (nonEmptyString(position.objection)) {
        const normalized = position.objection.trim().toLowerCase();
        if (objectionTexts.has(normalized)) errors.push(`${position.id}.objection duplicates another position exactly`);
        objectionTexts.add(normalized);
      }

      for (const field of ["dimension_values", "sampling_coordinates"]) {
        if (!isObject(position[field])) {
          errors.push(`${position.id}.${field} must be an object`);
        } else if (!sameItems(Object.keys(position[field]), dimensionNames)) {
          errors.push(`${position.id}.${field} keys must match adversarial_dimensions in order`);
        }
      }

      if (expected && isObject(position.dimension_values)) {
        dimensionNames.forEach((name) => {
          if (position.dimension_values[name] !== expected.dimension_values[name]) {
            errors.push(`${position.id}.dimension_values["${name}"] does not match deterministic Halton sampling`);
          }
        });
      }
      if (expected && isObject(position.sampling_coordinates)) {
        dimensionNames.forEach((name) => {
          if (position.sampling_coordinates[name] !== expected.sampling_coordinates[name]) {
            errors.push(`${position.id}.sampling_coordinates["${name}"] does not match deterministic Halton sampling`);
          }
        });
      }

      validateReferences(position.evidence_ids, evidenceIds, `${position.id}.evidence_ids`, errors, {
        required: report.grounding_mode !== "ungrounded",
      });
    });
  }

  if (!Array.isArray(report.decision_factors) || report.decision_factors.length < 3 || report.decision_factors.length > 7) {
    errors.push("decision_factors must contain 3-7 items");
  } else {
    validateUniqueItems(report.decision_factors, "decision_factors", errors);
    report.decision_factors.forEach((factor, index) => {
      const label = `decision_factors[${index}]`;
      if (!validateObjectShape(factor, label, OBJECT_FIELDS.decisionFactor, errors)) return;
      if (!nonEmptyString(factor.name)) errors.push(`${label}.name must be a non-empty string`);
      if (!FACTOR_STATUSES.includes(factor.status)) errors.push(`${label}.status must be one of: ${FACTOR_STATUSES.join(", ")}`);
      if (!nonEmptyString(factor.reason)) errors.push(`${label}.reason must be a non-empty string`);
      validateReferences(factor.evidence_ids, evidenceIds, `${label}.evidence_ids`, errors);
    });
  }

  if (!Array.isArray(report.hard_nos) || report.hard_nos.length < 3 || report.hard_nos.length > 5) {
    errors.push("hard_nos must contain 3-5 items");
  } else {
    validateUniqueItems(report.hard_nos, "hard_nos", errors);
    report.hard_nos.forEach((hardNo, index) => {
      const label = `hard_nos[${index}]`;
      if (!validateObjectShape(hardNo, label, OBJECT_FIELDS.hardNo, errors)) return;
      ["title", "objection", "why_it_matters", "response"].forEach((field) => {
        if (!nonEmptyString(hardNo[field])) errors.push(`${label}.${field} must be a non-empty string`);
      });
      if (!SEVERITIES.includes(hardNo.severity)) errors.push(`${label}.severity must be one of: ${SEVERITIES.join(", ")}`);
      validateReferences(hardNo.evidence_ids, evidenceIds, `${label}.evidence_ids`, errors, {
        required: report.grounding_mode !== "ungrounded",
      });
      validateReferences(hardNo.position_ids, positionIds, `${label}.position_ids`, errors, { required: true });
    });
  }

  if (validateObjectShape(report.recommendation, "recommendation", OBJECT_FIELDS.recommendation, errors)) {
    if (!VERDICTS.includes(report.recommendation.verdict)) errors.push(`recommendation.verdict must be one of: ${VERDICTS.join(", ")}`);
    if (!CONFIDENCE.includes(report.recommendation.confidence)) errors.push(`recommendation.confidence must be one of: ${CONFIDENCE.join(", ")}`);
    if (!nonEmptyString(report.recommendation.decisive_reason)) errors.push("recommendation.decisive_reason must be a non-empty string");
    for (const field of ["evidence_limits", "reversal_evidence"]) {
      validateStringArray(report.recommendation[field], `recommendation.${field}`, errors, { min: 1, max: 5 });
    }
    if (report.grounding_mode === "ungrounded" && report.recommendation.confidence !== "low") {
      errors.push('ungrounded reports must use recommendation.confidence "low"');
    }
    if (report.recommendation.verdict === "Do not build") {
      const hasFatal = Array.isArray(report.hard_nos) && report.hard_nos.some((item) => item?.severity === "fatal");
      const hasContradiction = Array.isArray(report.decision_factors) && report.decision_factors.some((item) => item?.status === "contradicted");
      if (!hasFatal && !hasContradiction) errors.push("Do not build requires a fatal Hard No or contradicted decision factor");
    }
    if (report.recommendation.verdict === "Build") {
      const hasDirectEvidence = Array.isArray(report.evidence)
        && report.evidence.some((item) => item?.type === "user-provided" || (item?.strength === "strong" && ["buyer-language", "current-behavior"].includes(item?.type)));
      const hasFatal = Array.isArray(report.hard_nos) && report.hard_nos.some((item) => item?.severity === "fatal");
      if (!hasDirectEvidence) errors.push("Build requires direct user-provided or strong buyer-behavior evidence");
      if (hasFatal) errors.push("Build cannot have an unresolved fatal Hard No");
      if (report.grounding_mode === "ungrounded") errors.push("Build cannot use ungrounded mode");
    }
  }

  if (!Array.isArray(report.mistakes_to_avoid) || report.mistakes_to_avoid.length < 3 || report.mistakes_to_avoid.length > 5) {
    errors.push("mistakes_to_avoid must contain 3-5 items");
  } else {
    validateStringArray(report.mistakes_to_avoid, "mistakes_to_avoid", errors, { min: 3, max: 5 });
  }

  if (validateObjectShape(report.next_action, "next_action", OBJECT_FIELDS.nextAction, errors)) {
    ["action", "why_now", "success_threshold", "kill_threshold"].forEach((field) => {
      if (!nonEmptyString(report.next_action[field])) errors.push(`next_action.${field} must be a non-empty string`);
    });
  }

  return { errors, warnings };
}

export function validateHtml(html, report, jsonPath = null, htmlPath = null) {
  const errors = [];
  const warnings = [];

  if (!html.toLowerCase().startsWith("<!doctype html>")) errors.push("HTML must start with <!doctype html>");
  let previousIndex = -1;
  REQUIRED_SECTIONS.forEach((section) => {
    const index = html.indexOf(`id="${section}"`);
    if (index === -1) errors.push(`HTML missing section id: ${section}`);
    if (index !== -1 && index < previousIndex) errors.push(`HTML section is out of order: ${section}`);
    if (index !== -1) previousIndex = index;
  });

  if (/<script\b/i.test(html)) errors.push("HTML must not include JavaScript");
  if (/<link\b/i.test(html)) errors.push("HTML must not include external link tags");
  if (/\bsrc\s*=/i.test(html)) errors.push("HTML must not include external assets");
  if (/@import/i.test(html)) errors.push("HTML must not import remote CSS");
  if (!/@media print/i.test(html)) errors.push("HTML must include print styles");
  if (/WOULD_PAY|NEEDS_PROOF|HARD_NO|Persona Sampling Map|Persona Reactions/i.test(html)) {
    errors.push("HTML contains obsolete persona or purchase-verdict language");
  }
  if (/\b\d+\s*\/\s*12\b/.test(html)) errors.push("HTML must not present sampled positions as a vote tally");

  (report.adversarial_positions || []).forEach((position) => {
    if (!html.includes(position.id)) errors.push(`HTML must include adversarial position ${position.id}`);
  });

  const hasSourceUrls = (report.evidence || []).some((item) => item.url);
  if (hasSourceUrls && !html.includes('rel="noopener noreferrer"')) errors.push("HTML source links must use rel=\"noopener noreferrer\"");

  if (jsonPath && htmlPath) {
    const jsonBase = path.basename(jsonPath, ".json");
    const htmlBase = path.basename(htmlPath, ".html");
    if (jsonBase !== htmlBase) errors.push("JSON and HTML filenames must use the same slug/date suffix");
  }

  return { errors, warnings };
}

export async function checkReport(jsonPath, htmlPath = null) {
  const startedAt = performance.now();
  const report = JSON.parse(await readFile(jsonPath, "utf8"));
  const objectResult = validateReportObject(report);
  const errors = [...objectResult.errors];
  const warnings = [...objectResult.warnings];

  if (htmlPath) {
    const html = await readFile(htmlPath, "utf8");
    const htmlResult = validateHtml(html, report, jsonPath, htmlPath);
    errors.push(...htmlResult.errors);
    warnings.push(...htmlResult.warnings);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    elapsed_ms: Number((performance.now() - startedAt).toFixed(2)),
    summary: {
      slug: report.slug,
      verdict: report.recommendation?.verdict,
      confidence: report.recommendation?.confidence,
      grounding_mode: report.grounding_mode,
      positions: Array.isArray(report.adversarial_positions) ? report.adversarial_positions.length : 0,
      evidence_items: Array.isArray(report.evidence) ? report.evidence.length : 0,
    },
  };
}

async function main() {
  const [, , jsonPath, htmlPath] = process.argv;
  if (!jsonPath) {
    console.error("Usage: node check-report.mjs <report.json> [report.html]");
    process.exit(1);
  }

  const result = await checkReport(jsonPath, htmlPath);
  const output = JSON.stringify(result, null, 2);
  if (!result.ok) {
    console.error(output);
    process.exit(1);
  }
  console.log(output);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { REQUIRED_SECTIONS };
