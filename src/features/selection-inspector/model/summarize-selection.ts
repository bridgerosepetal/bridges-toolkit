import {
	getSelectionSnapshot,
	type SelectionSummary,
} from "./get-selection-snapshot";

export function summarizeSelection(
	nodes: readonly SceneNode[],
): SelectionSummary {
	return getSelectionSnapshot(nodes).summary;
}
