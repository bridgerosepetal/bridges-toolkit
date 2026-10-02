const DEFAULT_MAX_SIZE = 10;

export function getSelectionKey(selection: readonly SceneNode[]): string {
	if (selection.length === 0) {
		return "__empty__";
	}

	return selection
		.map((node) => node.id)
		.sort()
		.join("|");
}

export type SelectionCache<V> = {
	get: (
		selection: readonly SceneNode[],
		options?: { bypassCache?: boolean },
	) => V;
	clear: () => void;
};

/**
 * Memoizes `compute` per selection, keeping the `maxSize` most recently used
 * entries.
 */
export function createSelectionCache<V>(
	compute: (selection: readonly SceneNode[]) => V,
	maxSize = DEFAULT_MAX_SIZE,
): SelectionCache<V> {
	const entries = new Map<string, V>();

	return {
		get(selection, options = {}) {
			const key = getSelectionKey(selection);

			if (options.bypassCache !== true && entries.has(key)) {
				const cached = entries.get(key) as V;
				// Re-insert so Map insertion order doubles as the LRU queue.
				entries.delete(key);
				entries.set(key, cached);
				return cached;
			}

			const value = compute(selection);
			entries.delete(key);
			entries.set(key, value);

			if (entries.size > maxSize) {
				const oldestKey = entries.keys().next().value;
				if (oldestKey !== undefined) {
					entries.delete(oldestKey);
				}
			}

			return value;
		},
		clear() {
			entries.clear();
		},
	};
}
