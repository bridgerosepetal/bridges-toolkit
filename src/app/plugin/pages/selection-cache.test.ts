import { describe, expect, it, vi } from "vitest";
import { createSelectionCache, getSelectionKey } from "./selection-cache";

function selection(...ids: Array<string>): readonly SceneNode[] {
	return ids.map((id) => ({ id }) as SceneNode);
}

describe("getSelectionKey", () => {
	it("is independent of selection order", () => {
		expect(getSelectionKey(selection("2:1", "1:1"))).toBe(
			getSelectionKey(selection("1:1", "2:1")),
		);
	});

	it("has a dedicated key for an empty selection", () => {
		expect(getSelectionKey([])).toBe("__empty__");
	});
});

describe("createSelectionCache", () => {
	it("computes once per selection until bypassed or cleared", () => {
		const compute = vi.fn((nodes: readonly SceneNode[]) => nodes.length);
		const cache = createSelectionCache(compute);

		cache.get(selection("a"));
		cache.get(selection("a"));
		expect(compute).toHaveBeenCalledTimes(1);

		cache.get(selection("a"), { bypassCache: true });
		expect(compute).toHaveBeenCalledTimes(2);

		cache.clear();
		cache.get(selection("a"));
		expect(compute).toHaveBeenCalledTimes(3);
	});

	it("evicts the least recently used selection", () => {
		const compute = vi.fn(() => ({}));
		const cache = createSelectionCache(compute, 2);

		cache.get(selection("a"));
		cache.get(selection("b"));
		cache.get(selection("a")); // "b" is now the oldest entry
		cache.get(selection("c"));
		expect(compute).toHaveBeenCalledTimes(3);

		cache.get(selection("a"));
		expect(compute).toHaveBeenCalledTimes(3);

		cache.get(selection("b"));
		expect(compute).toHaveBeenCalledTimes(4);
	});
});
