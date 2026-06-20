import type { ExtractedTextNode } from "../model/types";

export function createLayoutFingerprint(node: ExtractedTextNode): string {
	const centerXRatio = (node.x + node.width / 2) / Math.max(node.frameWidth, 1);
	const centerYRatio =
		(node.y + node.height / 2) / Math.max(node.frameHeight, 1);

	const horizontalBucket = bucketAxis(centerXRatio, [
		"left",
		"center",
		"right",
	]);
	const verticalBucket = bucketAxis(centerYRatio, ["top", "middle", "bottom"]);
	const parentKey = node.context?.parentPath?.join("/") ?? "__root__";

	return `${horizontalBucket}|${verticalBucket}|${parentKey}`;
}

function bucketAxis(
	value: number,
	labels: [string, string, string] | Array<string>,
): string {
	if (value < 0.33) {
		return labels[0];
	}
	if (value < 0.66) {
		return labels[1];
	}
	return labels[2];
}
