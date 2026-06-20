import { runDiagnosticsCommand } from "@features/selection-inspector/api/run-diagnostics-command";
import { runMainCommand } from "./run-main-command";

function executeWithGuard(handler: () => void): void {
	try {
		handler();
	} catch (error) {
		console.error("[plugin] Unhandled error", error);
		figma.closePlugin(
			"Plugin failed. Check the Figma console for details.",
		);
	}
}

export default function run(): void {
	executeWithGuard(runMainCommand);
}

export function diagnostics(): void {
	executeWithGuard(runDiagnosticsCommand);
}
