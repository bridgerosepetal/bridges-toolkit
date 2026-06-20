export function calculateStringSimilarity(a: string, b: string): number {
	if (a === b) {
		return 1;
	}
	if (a.length === 0 || b.length === 0) {
		return 0;
	}

	const distance = levenshteinDistance(a, b);
	const maxLength = Math.max(a.length, b.length);
	return 1 - distance / maxLength;
}

function levenshteinDistance(a: string, b: string): number {
	const rows = a.length + 1;
	const cols = b.length + 1;
	const matrix: Array<Array<number>> = Array.from({ length: rows }, () =>
		new Array<number>(cols).fill(0),
	);

	for (let row = 0; row < rows; row += 1) {
		matrix[row][0] = row;
	}
	for (let col = 0; col < cols; col += 1) {
		matrix[0][col] = col;
	}

	for (let row = 1; row < rows; row += 1) {
		for (let col = 1; col < cols; col += 1) {
			const substitutionCost = a[row - 1] === b[col - 1] ? 0 : 1;
			matrix[row][col] = Math.min(
				matrix[row - 1][col] + 1,
				matrix[row][col - 1] + 1,
				matrix[row - 1][col - 1] + substitutionCost,
			);
		}
	}

	return matrix[rows - 1][cols - 1];
}
