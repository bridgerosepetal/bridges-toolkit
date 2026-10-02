import { describe, expect, it } from "vitest";
import { calculateStringSimilarity } from "./string-similarity";

describe("calculateStringSimilarity", () => {
	it("returns 1 for identical strings", () => {
		expect(calculateStringSimilarity("sign in", "sign in")).toBe(1);
	});

	it("returns 0 when either string is empty", () => {
		expect(calculateStringSimilarity("", "abc")).toBe(0);
		expect(calculateStringSimilarity("abc", "")).toBe(0);
	});

	it("normalizes the edit distance by the longer string", () => {
		expect(calculateStringSimilarity("kitten", "sitting")).toBeCloseTo(
			1 - 3 / 7,
		);
		expect(calculateStringSimilarity("price", "prices")).toBeCloseTo(
			1 - 1 / 6,
		);
	});

	it("is symmetric", () => {
		expect(calculateStringSimilarity("flaw", "lawn")).toBe(
			calculateStringSimilarity("lawn", "flaw"),
		);
	});

	it("keeps scores that exactly meet the threshold", () => {
		// One edit across ten characters is exactly 0.9.
		expect(calculateStringSimilarity("abcdefghij", "abcdefghik", 0.9)).toBe(
			0.9,
		);
	});

	it("returns 0 early when the threshold cannot be reached", () => {
		expect(
			calculateStringSimilarity("ok", "a much longer label", 0.9),
		).toBe(0);
		expect(calculateStringSimilarity("abcdefghij", "klmnopqrst", 0.9)).toBe(
			0,
		);
	});

	it("matches the unbounded score whenever it reaches the threshold", () => {
		const pairs: Array<[string, string]> = [
			["get started", "get startd"],
			["learn more", "learn  more"],
			["terms of service", "terms of services"],
		];

		for (const [a, b] of pairs) {
			const unbounded = calculateStringSimilarity(a, b);
			expect(unbounded).toBeGreaterThanOrEqual(0.9);
			expect(calculateStringSimilarity(a, b, 0.9)).toBe(unbounded);
		}
	});
});
