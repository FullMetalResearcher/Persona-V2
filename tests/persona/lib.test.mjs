import assert from "node:assert/strict";
import test from "node:test";

import { isObject, nonEmptyString, normalizeHttpUrl, sequentialId } from "../../plugins/persona/skills/persona/scripts/lib.mjs";
import { UNSAFE_URLS } from "./test-helpers.mjs";

test("normalizes only absolute HTTP and HTTPS URLs", () => {
  assert.equal(normalizeHttpUrl("http://example.com/path"), "http://example.com/path");
  assert.equal(normalizeHttpUrl("HTTPS://example.com/path?q=1"), "https://example.com/path?q=1");

  for (const value of [...UNSAFE_URLS, "//example.com/path", "", null]) {
    assert.equal(normalizeHttpUrl(value), null);
  }
});

test("formats sequential ids with two-digit zero padding", () => {
  assert.equal(sequentialId("E", 0), "E01");
  assert.equal(sequentialId("E", 8), "E09");
  assert.equal(sequentialId("A", 11), "A12");
  assert.equal(sequentialId("A", 99), "A100");
});

test("classifies objects and non-empty strings", () => {
  assert.equal(isObject({}), true);
  assert.equal(isObject([]), false);
  assert.equal(isObject(null), false);
  assert.equal(nonEmptyString("x"), true);
  assert.equal(nonEmptyString("   "), false);
  assert.equal(nonEmptyString(42), false);
});
