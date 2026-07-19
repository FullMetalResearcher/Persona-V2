import { readFile, writeFile } from "node:fs/promises";
import { isObject, nonEmptyString, runCli, sequentialId } from "./lib.mjs";

export const PRIME_BASES = [2, 3, 5, 7, 11, 13];
export const SAMPLE_COUNT = 12;

export function validateDimensions(dimensions) {
  if (!Array.isArray(dimensions) || dimensions.length !== PRIME_BASES.length) {
    throw new Error(`adversarial_dimensions must contain exactly ${PRIME_BASES.length} items`);
  }

  const names = new Set();

  dimensions.forEach((dimension, index) => {
    if (!isObject(dimension)) throw new Error(`adversarial_dimensions[${index}] must be an object`);
    if (!nonEmptyString(dimension.name)) throw new Error(`adversarial_dimensions[${index}].name must be a non-empty string`);
    if (names.has(dimension.name)) throw new Error(`Duplicate adversarial dimension: ${dimension.name}`);
    names.add(dimension.name);

    if (!Array.isArray(dimension.buckets) || dimension.buckets.length < 3 || dimension.buckets.length > 6) {
      throw new Error(`${dimension.name}.buckets must contain 3-6 items`);
    }

    const buckets = new Set();
    dimension.buckets.forEach((bucket, bucketIndex) => {
      if (!nonEmptyString(bucket)) throw new Error(`${dimension.name}.buckets[${bucketIndex}] must be a non-empty string`);
      if (buckets.has(bucket)) throw new Error(`${dimension.name}.buckets must not contain duplicates`);
      buckets.add(bucket);
    });
  });
}

function radicalInverse(index, base) {
  let result = 0;
  let fraction = 1 / base;
  let remaining = index;

  while (remaining > 0) {
    result += (remaining % base) * fraction;
    remaining = Math.floor(remaining / base);
    fraction /= base;
  }

  return Number(result.toFixed(6));
}

function bucketForCoordinate(coordinate, buckets) {
  return buckets[Math.min(buckets.length - 1, Math.floor(coordinate * buckets.length))];
}

export function sampleAdversarialPositions(dimensions) {
  validateDimensions(dimensions);

  return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const dimensionValues = {};
    const samplingCoordinates = {};

    dimensions.forEach((dimension, dimensionIndex) => {
      const coordinate = radicalInverse(index + 1, PRIME_BASES[dimensionIndex]);
      samplingCoordinates[dimension.name] = coordinate;
      dimensionValues[dimension.name] = bucketForCoordinate(coordinate, dimension.buckets);
    });

    return {
      id: sequentialId("A", index),
      dimension_values: dimensionValues,
      sampling_coordinates: samplingCoordinates,
    };
  });
}

export function applySampling(report) {
  if (!isObject(report)) throw new Error("report must be an object");

  const sampled = sampleAdversarialPositions(report.adversarial_dimensions);
  const existingById = new Map(
    (Array.isArray(report.adversarial_positions) ? report.adversarial_positions : [])
      .filter(isObject)
      .map((position) => [position.id, position]),
  );

  return {
    ...report,
    sampling_method: "halton",
    adversarial_positions: sampled.map((position) => ({
      ...(existingById.get(position.id) || {}),
      ...position,
    })),
  };
}

runCli(
  import.meta.url,
  "Usage: node halton-sampler.mjs <report.json> [--apply]",
  async (inputPath, flag) => {
    const report = JSON.parse(await readFile(inputPath, "utf8"));
    const sampledReport = applySampling(report);

    if (flag === "--apply") {
      await writeFile(inputPath, `${JSON.stringify(sampledReport, null, 2)}\n`, "utf8");
      console.log(JSON.stringify({ output: inputPath, positions: SAMPLE_COUNT, sampling_method: "halton" }, null, 2));
      return;
    }

    console.log(JSON.stringify(sampledReport.adversarial_positions, null, 2));
  },
);
