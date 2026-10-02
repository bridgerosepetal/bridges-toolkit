import type { UiToMainMessage } from "@app/api/messages";
import { getFrameTextSnapshot } from "@features/selection-inspector/model/get-frame-text-snapshot";
import type { CreatePageBridgeOptions, PageBridge } from "../PageBridge";
import { createSelectionCache, getSelectionKey } from "../selection-cache";

function createFrameTextExtractorPageBridge(
	options: CreatePageBridgeOptions,
): PageBridge {
	const { postToUi } = options;
	const snapshotCache = createSelectionCache(getFrameTextSnapshot);
	let lastPostedSelectionKey: string | null = null;

	const postFrameTextSnapshot = (
		options: { skipIfSameSelection?: boolean } = {},
	): void => {
		const currentSelection = figma.currentPage.selection;
		const selectionKey = getSelectionKey(currentSelection);

		if (
			options.skipIfSameSelection === true &&
			lastPostedSelectionKey === selectionKey
		) {
			return;
		}

		postToUi({
			type: "FRAME_TEXT_SNAPSHOT",
			snapshot: snapshotCache.get(currentSelection),
		});
		lastPostedSelectionKey = selectionKey;
	};

	return {
		enter() {
			postFrameTextSnapshot();
		},
		handleUiMessage(message: UiToMainMessage) {
			if (message.type !== "REQUEST_FRAME_TEXT_SNAPSHOT") {
				return false;
			}

			postFrameTextSnapshot();
			return true;
		},
		onSelectionChange() {
			postFrameTextSnapshot({ skipIfSameSelection: true });
		},
		onCurrentPageChange() {
			postFrameTextSnapshot({ skipIfSameSelection: true });
		},
		onDocumentChange() {
			snapshotCache.clear();
			lastPostedSelectionKey = null;
			postFrameTextSnapshot();
		},
	};
}

export const createPageBridge = createFrameTextExtractorPageBridge;
