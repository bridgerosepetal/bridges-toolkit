import { summarizeSelection } from "../model/summarize-selection";

export function runDiagnosticsCommand(): void {
	const selection = figma.currentPage.selection;
	const summary = summarizeSelection(selection);

	console.log("[diagnostics] selection", summary);
	figma.closePlugin(
		`Diagnostics: ${summary.selectedRoots} roots, ${summary.totalNodes} total nodes, ${summary.textNodes} text nodes.`,
	);
}
