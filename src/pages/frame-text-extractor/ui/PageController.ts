import { copyTextToClipboard } from "@shared/lib/copy-to-clipboard";
import {
	createFrameTextExport,
	type FrameTextSnapshot,
} from "@features/selection-inspector/model/get-frame-text-snapshot";
import type { UiBridge } from "@shared/api/UiBridge";
import type { PageController, Render } from "@shared/lib/PageController";

type State = {
	status: string;
	snapshot: FrameTextSnapshot | null;
};

type PageMessage =
	| {
			type: "FRAME_TEXT_SNAPSHOT";
			snapshot: FrameTextSnapshot;
	  }
	| {
			type: "ERROR";
			message: string;
	  };

type ViewModel = {
	status: string;
	snapshot: FrameTextSnapshot | null;
};

type Actions = {
	onRefresh: () => void;
	onCopyAll: () => Promise<void>;
};

type Controller = PageController & {
	getViewModel: () => ViewModel;
	getActions: (render: Render) => Actions;
};

function createFrameTextExtractorPageController(
	bridge: UiBridge,
): Controller {
	const state: State = {
		status: "Idle",
		snapshot: null,
	};

	return {
		enter(render) {
			if (state.snapshot === null) {
				state.status = "Loading frame text...";
				render();
			}
			bridge.requestFrameTextSnapshot();
		},
		handleMessage(message, render) {
			const pageMessage = message as PageMessage;

			if (pageMessage.type === "FRAME_TEXT_SNAPSHOT") {
				state.snapshot = pageMessage.snapshot;
				const exportSnapshot = createFrameTextExport(pageMessage.snapshot);
				if (pageMessage.snapshot.frames.length === 0) {
					state.status = "Select at least one frame.";
				} else if (exportSnapshot.frames.length === 0) {
					state.status = "No text found in selected frames.";
				} else {
					state.status = "Frame text synced.";
				}
				render();
				return;
			}

			if (pageMessage.type === "ERROR") {
				state.status = pageMessage.message;
				render();
			}
		},
		getViewModel() {
			return {
				status: state.status,
				snapshot: state.snapshot,
			};
		},
		getActions(render) {
			return {
				onRefresh() {
					state.status = "Refreshing frame text...";
					render();
					bridge.requestFrameTextSnapshot();
				},
				async onCopyAll() {
					if (
						state.snapshot === null ||
						state.snapshot.frames.length === 0
					) {
						state.status = "Nothing to copy. Select at least one frame.";
						render();
						return;
					}

					const exportSnapshot = createFrameTextExport(state.snapshot);
					if (exportSnapshot.frames.length === 0) {
						state.status = "No extracted text to copy.";
						render();
						return;
					}

					try {
						await copyTextToClipboard(
							JSON.stringify(
								exportSnapshot,
								null,
								2,
							),
						);
						state.status = "Copied extracted text JSON.";
						render();
					} catch (error) {
						console.error("[ui] frame text copy failed", error);
						state.status = "Copy failed. Check browser permissions.";
						render();
					}
				},
			};
		},
	};
}

export const createPageController = createFrameTextExtractorPageController;
