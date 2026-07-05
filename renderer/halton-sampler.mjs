const PRIME_BASES = [2, 3, 5, 7, 11, 13];
const SAMPLE_COUNT = 12;

const DIMENSION_BUCKETS = {
  B2B: {
    "company size": ["solo", "2-10", "11-50", "51-200", "201-1000", "1000+"],
    "buyer role": ["founder", "marketing", "product", "growth", "operations", "finance/procurement"],
    "budget authority": ["none", "influencer", "small discretionary", "team budget", "department owner", "executive owner"],
    urgency: ["vague-curiosity", "nice-to-have", "active-pain", "deadline-driven", "burning-now"],
    "switching pain": ["very-low", "low", "medium", "high", "very-high"],
    "trust/compliance barrier": ["low", "medium", "high", "very-high", "regulated"],
  },
  B2C: {
    "consumer archetype": [
      "novelty seeker",
      "overwhelmed user",
      "productivity buyer",
      "privacy-sensitive user",
      "budget-constrained user",
      "community-led user",
    ],
    "pain frequency": ["rare", "occasional", "monthly", "weekly", "daily"],
    "willingness to pay": ["very-low", "low", "medium", "high"],
    "habit strength": ["low", "medium", "high", "very-high"],
    "trust/risk sensitivity": ["low", "medium", "high", "very-high"],
    "channel accessibility": ["low", "medium", "high", "community-driven"],
  },
  "marketplace/platform": {
    "supply-side motivation": ["low", "side-income", "portfolio/reputation", "lead generation", "high-paid expert"],
    "demand-side urgency": ["low", "medium", "high", "deadline-driven", "burning-now"],
    "liquidity difficulty": ["low", "medium", "high", "very-high"],
    "trust requirement": ["low", "medium", "high", "very-high"],
    "repeat-use likelihood": ["one-time", "low", "medium", "high"],
    "switching friction": ["low", "medium", "high", "very-high"],
  },
};

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
  const bucketIndex = Math.min(buckets.length - 1, Math.floor(coordinate * buckets.length));
  return buckets[bucketIndex];
}

export function getSamplingDimensions(ideaType) {
  const buckets = DIMENSION_BUCKETS[ideaType];

  if (!buckets) {
    throw new Error(`Unsupported idea type: ${ideaType}`);
  }

  return Object.keys(buckets);
}

export function samplePersonaPositions(ideaType) {
  const bucketsByDimension = DIMENSION_BUCKETS[ideaType];

  if (!bucketsByDimension) {
    throw new Error(`Unsupported idea type: ${ideaType}`);
  }

  const dimensions = Object.keys(bucketsByDimension);

  return Array.from({ length: SAMPLE_COUNT }, (_, index) => {
    const coordinates = PRIME_BASES.map((base) => radicalInverse(index + 1, base));
    const samplingCoordinates = {};
    const sampledDimensions = {};

    dimensions.forEach((dimension, dimensionIndex) => {
      const coordinate = coordinates[dimensionIndex];
      samplingCoordinates[dimension] = coordinate;
      sampledDimensions[dimension] = bucketForCoordinate(coordinate, bucketsByDimension[dimension]);
    });

    return {
      id: `P${String(index + 1).padStart(2, "0")}`,
      dimensions: sampledDimensions,
      sampling_coordinates: samplingCoordinates,
      map_position: {
        x: coordinates[0],
        y: coordinates[1],
      },
    };
  });
}

export { DIMENSION_BUCKETS, PRIME_BASES, SAMPLE_COUNT };
