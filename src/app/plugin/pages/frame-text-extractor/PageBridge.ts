import type {
	MainToUiMessage,
	UiToMainMessage,
} from "@app/api/messages";
import {
	getFrameTextSnapshot,
	type FrameTextSnapshot,
} from "@features/selection-inspector/model/get-frame-text-snapshot";
import type { CreatePageBridgeOptions, PageBridge } from "../PageBridge";

const MAX_CACHE_SIZE = 10;

function createFrameTextExtractorPageBridge(
	options: CreatePageBridgeOptions,
): PageBridge {
	const { postToUi } = options;
	const snapshotCache = new Map<string, FrameTextSnapshot>();
	let lastPostedSelectionKey: string | null = null;

	const getSelectionKey = (selection: readonly SceneNode[]): string => {
		if (selection.length === 0) {
			return "__empty__";
		}

		return selection
			.map((node) => node.id)
			.sort()
			.join("|");
	};

	const getSnapshotForSelection = (
		selection: readonly SceneNode[],
	): FrameTextSnapshot => {
		const selectionKey = getSelectionKey(selection);
		const cachedSnapshot = snapshotCache.get(selectionKey);

		if (cachedSnapshot !== undefined) {
			// Move to the end to keep insertion order as an LRU queue.
			snapshotCache.delete(selectionKey);
			snapshotCache.set(selectionKey, cachedSnapshot);
			return cachedSnapshot;
		}

		const snapshot = getFrameTextSnapshot(selection);
		snapshotCache.set(selectionKey, snapshot);

		if (snapshotCache.size > MAX_CACHE_SIZE) {
			const oldestKey = snapshotCache.keys().next().value as
				| string
				| undefined;
			if (oldestKey !== undefined) {
				snapshotCache.delete(oldestKey);
			}
		}

		return snapshot;
	};

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
			snapshot: getSnapshotForSelection(currentSelection),
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
