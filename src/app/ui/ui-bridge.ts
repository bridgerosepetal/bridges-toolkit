import type { MainToUiMessage, UiToMainMessage } from "@app/api/messages";
import type { UiBridge } from "@shared/api/UiBridge";

export function createUiBridge(): UiBridge {
	return {
		setActivePage(page) {
			postToPlugin({
				type: "SET_ACTIVE_PAGE",
				page,
			});
		},
		requestSelectionSnapshot() {
			postToPlugin({
				type: "REQUEST_SELECTION_SNAPSHOT",
			});
		},
		requestFrameTextSnapshot() {
			postToPlugin({
				type: "REQUEST_FRAME_TEXT_SNAPSHOT",
			});
		},
		requestTextAuditNodes() {
			postToPlugin({
				type: "REQUEST_TEXT_AUDIT_NODES",
			});
		},
		setTextAuditSelectionLock(isLocked) {
			postToPlugin({
				type: "SET_TEXT_AUDIT_SELECTION_LOCK",
				isLocked,
			});
		},
		toggleTextAuditFrameGroupMarks() {
			postToPlugin({
				type: "TOGGLE_TEXT_AUDIT_FRAME_GROUP_MARKS",
			});
		},
		resizePluginUi(width, height) {
			postToPlugin({
				type: "RESIZE_PLUGIN_UI",
				width,
				height,
			});
		},
		closePlugin() {
			postToPlugin({
				type: "CLOSE_PLUGIN",
			});
		},
		onMessage(handler) {
			window.onmessage = (
				event: MessageEvent<{ pluginMessage?: unknown }>,
			) => {
				const message = event.data.pluginMessage;
				if (!isMainToUiMessage(message)) {
					return;
				}
				handler(message);
			};
		},
	};
}

function postToPlugin(message: UiToMainMessage): void {
	parent.postMessage({ pluginMessage: message }, "*");
}

function isMainToUiMessage(value: unknown): value is MainToUiMessage {
	if (typeof value !== "object" || value === null || !("type" in value)) {
		return false;
	}

	const typed = value as { type: unknown };
	return (
		typed.type === "SELECTION_SNAPSHOT" ||
		typed.type === "FRAME_TEXT_SNAPSHOT" ||
		typed.type === "TEXT_AUDIT_NODES" ||
		typed.type === "TEXT_AUDIT_FRAME_GROUP_MARK_STATUS" ||
		typed.type === "ERROR"
	);
}
