/**
 * Normalized Levenshtein similarity in the range [0, 1].
 *
 * When `minSimilarity` is given, the comparison may stop early and return 0
 * as soon as the result is known to be below that threshold.
 */
export function calculateStringSimilarity(
	a: string,
	b: string,
	minSimilarity = 0,
): number {
	if (a === b) {
		return 1;
	}
	if (a.length === 0 || b.length === 0) {
		return 0;
	}

	const maxLength = Math.max(a.length, b.length);
	const maxDistance = Math.floor((1 - minSimilarity) * maxLength + 1e-9);

	// The edit distance is at least the difference in length.
	if (Math.abs(a.length - b.length) > maxDistance) {
		return 0;
	}

	const distance = levenshteinDistance(a, b, maxDistance);
	if (distance > maxDistance) {
		return 0;
	}

	return 1 - distance / maxLength;
}

/**
 * Returns the edit distance, or any value greater than `maxDistance` once the
 * distance is known to exceed it.
 */
function levenshteinDistance(
	a: string,
	b: string,
	maxDistance: number,
): number {
	let previousRow = new Array<number>(b.length + 1);
	let currentRow = new Array<number>(b.length + 1);

	for (let col = 0; col <= b.length; col += 1) {
		previousRow[col] = col;
	}

	for (let row = 1; row <= a.length; row += 1) {
		currentRow[0] = row;
		let rowMinimum = row;

		for (let col = 1; col <= b.length; col += 1) {
			const substitutionCost = a[row - 1] === b[col - 1] ? 0 : 1;
			const value = Math.min(
				previousRow[col] + 1,
				currentRow[col - 1] + 1,
				previousRow[col - 1] + substitutionCost,
			);
			currentRow[col] = value;
			if (value < rowMinimum) {
				rowMinimum = value;
			}
		}

		// Row minimums never decrease, so the final distance can't recover.
		if (rowMinimum > maxDistance) {
			return rowMinimum;
		}

		[previousRow, currentRow] = [currentRow, previousRow];
	}

	return previousRow[b.length];
}
