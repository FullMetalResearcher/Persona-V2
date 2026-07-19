import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CONFIDENCE,
  EVIDENCE_STRENGTHS,
  EVIDENCE_TYPES,
  FACTOR_STATUSES,
  GROUNDING_MODES,
  IDEA_TYPES,
  OBJECT_FIELDS,
  REQUIRED_TOP_LEVEL,
  SEVERITIES,
  STANCES,
  VERDICTS,
} from "../../plugins/persona/skills/persona/scripts/check-report.mjs";
import { PRIME_BASES, SAMPLE_COUNT } from "../../plugins/persona/skills/persona/scripts/halton-sampler.mjs";

const SCHEMA_URL = new URL(
  "../../plugins/persona/skills/persona/schema/persona-report.schema.json",
  import.meta.url,
);
const schema = JSON.parse(await readFile(SCHEMA_URL, "utf8"));

test("schema enums match the validator constants", () => {
  assert.deepEqual(schema.properties.idea_type.enum, IDEA_TYPES);
  assert.deepEqual(schema.properties.grounding_mode.enum, GROUNDING_MODES);
  assert.deepEqual(schema.$defs.position.properties.stance.enum, STANCES);
  assert.deepEqual(schema.$defs.decisionFactor.properties.status.enum, FACTOR_STATUSES);
  assert.deepEqual(schema.$defs.hardNo.properties.severity.enum, SEVERITIES);
  assert.deepEqual(schema.$defs.recommendation.properties.verdict.enum, VERDICTS);
  assert.deepEqual(schema.$defs.recommendation.properties.confidence.enum, CONFIDENCE);
  assert.deepEqual(schema.$defs.evidence.properties.type.enum, EVIDENCE_TYPES);
  assert.deepEqual(schema.$defs.evidence.properties.strength.enum, EVIDENCE_STRENGTHS);
});

test("schema required fields match the validator field lists", () => {
  assert.deepEqual(schema.required, REQUIRED_TOP_LEVEL);
  assert.deepEqual(schema.properties.input.required, OBJECT_FIELDS.input);
  assert.deepEqual(schema.$defs.evidence.required, OBJECT_FIELDS.evidence);
  assert.deepEqual(schema.$defs.dimension.required, OBJECT_FIELDS.dimension);
  assert.deepEqual(schema.$defs.position.required, OBJECT_FIELDS.position);
  assert.deepEqual(schema.$defs.decisionFactor.required, OBJECT_FIELDS.decisionFactor);
  assert.deepEqual(schema.$defs.hardNo.required, OBJECT_FIELDS.hardNo);
  assert.deepEqual(schema.$defs.recommendation.required, OBJECT_FIELDS.recommendation);
  assert.deepEqual(schema.$defs.nextAction.required, OBJECT_FIELDS.nextAction);
});

test("schema sampling counts match the Halton sampler", () => {
  assert.equal(schema.properties.adversarial_dimensions.minItems, PRIME_BASES.length);
  assert.equal(schema.properties.adversarial_dimensions.maxItems, PRIME_BASES.length);
  assert.equal(schema.properties.adversarial_positions.minItems, SAMPLE_COUNT);
  assert.equal(schema.properties.adversarial_positions.maxItems, SAMPLE_COUNT);
});
