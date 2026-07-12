import assert from "node:assert/strict";
import test from "node:test";

import { applySampling, sampleAdversarialPositions, validateDimensions } from "./halton-sampler.mjs";
import { clone, loadGoldenReport } from "./test-helpers.mjs";

test("sampling is deterministic and produces the audited IDs and coordinates", async () => {
  const report = await loadGoldenReport();
  const first = sampleAdversarialPositions(report.adversarial_dimensions);
  const second = sampleAdversarialPositions(report.adversarial_dimensions);
  assert.deepEqual(first, second);
  assert.equal(first.length, 12);
  assert.deepEqual(first.map((position) => position.id), Array.from({ length: 12 }, (_, index) => `A${String(index + 1).padStart(2, "0")}`));
  first.forEach((position) => {
    assert.deepEqual(Object.keys(position.dimension_values), report.adversarial_dimensions.map((dimension) => dimension.name));
    Object.values(position.sampling_coordinates).forEach((coordinate) => {
      assert.ok(coordinate >= 0 && coordinate < 1);
    });
  });
});

test("applySampling preserves enriched position fields and repairs sampled fields", async () => {
  const report = await loadGoldenReport();
  const modified = clone(report);
  modified.adversarial_positions[0].label = "Preserved label";
  modified.adversarial_positions[0].objection = "Preserved objection";
  modified.adversarial_positions[0].dimension_values = { wrong: "value" };
  modified.adversarial_positions[0].sampling_coordinates = { wrong: 2 };

  const applied = applySampling(modified);
  assert.equal(applied.adversarial_positions[0].label, "Preserved label");
  assert.equal(applied.adversarial_positions[0].objection, "Preserved objection");
  assert.deepEqual(applied.adversarial_positions[0].dimension_values, report.adversarial_positions[0].dimension_values);
  assert.deepEqual(applied.adversarial_positions[0].sampling_coordinates, report.adversarial_positions[0].sampling_coordinates);
  assert.equal(applied.sampling_method, "halton");
});

test("dimension validation rejects malformed and duplicate values", async () => {
  const report = await loadGoldenReport();
  const duplicateName = clone(report.adversarial_dimensions);
  duplicateName[1].name = duplicateName[0].name;
  assert.throws(() => validateDimensions(duplicateName), /Duplicate adversarial dimension/);

  const duplicateBucket = clone(report.adversarial_dimensions);
  duplicateBucket[0].buckets[1] = duplicateBucket[0].buckets[0];
  assert.throws(() => validateDimensions(duplicateBucket), /must not contain duplicates/);

  const wrongType = clone(report.adversarial_dimensions);
  wrongType[0].buckets[0] = 42;
  assert.throws(() => validateDimensions(wrongType), /must be a non-empty string/);
});
