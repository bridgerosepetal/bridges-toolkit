import type {
	MainToUiMessage,
	UiToMainMessage,
} from "@app/api/messages";

export type CreatePageBridgeOptions = {
	postToUi: (message: MainToUiMessage) => void;
};

export type PageBridge = {
	enter: () => void;
	handleUiMessage: (message: UiToMainMessage) => boolean;
	onSelectionChange: () => void;
	onCurrentPageChange: () => void;
	onDocumentChange: () => void;
};

export function createEmptyPageBridge(): PageBridge {
	return {
		enter() {},
		handleUiMessage() {
			return false;
		},
		onSelectionChange() {},
		onCurrentPageChange() {},
		onDocumentChange() {},
	};
}
