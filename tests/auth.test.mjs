import test from "node:test";
import assert from "node:assert/strict";
import { authOrigin, passwordError, validEmail } from "../lib/logic/auth-validation.ts";

test("auth return origin excludes unsafe protocols, credentials and URL suffixes", () => {
 assert.equal(authOrigin(" https://finance-task-tracker-pi.vercel.app/ ", null), "https://finance-task-tracker-pi.vercel.app");
 assert.equal(authOrigin(undefined, "http://127.0.0.1:3000"), "http://127.0.0.1:3000");
 for (const url of ["javascript:alert(1)", "http://example.com", "https://user:pass@example.com", "https://example.com/reset", "https://example.com?next=evil", "https://example.com#token", "https://", ""]) assert.equal(authOrigin(url, null), null);
});

test("recovery rejects malformed email and mismatched or out-of-range passwords", () => {
 assert.equal(validEmail("person@example.com"), true);
 for (const email of ["person", "person@", "person @example.com", "a".repeat(255) + "@example.com"]) assert.equal(validEmail(email), false);
 assert.equal(passwordError("long-enough", "different"), "The passwords do not match.");
 assert.equal(passwordError("1234567", "1234567"), "Use a password of 8–128 characters.");
 assert.equal(passwordError("a".repeat(129), "a".repeat(129)), "Use a password of 8–128 characters.");
 assert.equal(passwordError("a".repeat(8), "a".repeat(8)), null);
 assert.equal(passwordError("a".repeat(128), "a".repeat(128)), null);
});
