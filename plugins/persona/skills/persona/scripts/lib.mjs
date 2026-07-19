import { pathToFileURL } from "node:url";

const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function sequentialId(prefix, index) {
  return `${prefix}${String(index + 1).padStart(2, "0")}`;
}

export function normalizeHttpUrl(value) {
  if (typeof value !== "string" || !HTTP_URL_PATTERN.test(value)) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function elapsedMs(startedAt) {
  return Number((performance.now() - startedAt).toFixed(2));
}

export function runCli(entryUrl, usage, main) {
  if (!process.argv[1] || entryUrl !== pathToFileURL(process.argv[1]).href) return;
  const args = process.argv.slice(2);
  if (!args[0]) {
    console.error(usage);
    process.exit(1);
  }
  main(...args).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
