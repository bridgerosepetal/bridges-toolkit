import { showUI } from "@create-figma-plugin/utilities";
import {
	type MainToUiMessage,
	isUiToMainMessage,
} from "@app/api/messages";
import type { PageId } from "@shared/config/PageId";
import { LISTED_PAGE_META } from "@app/pages/page-meta";
import { RUN_UI_HEIGHT, RUN_UI_WIDTHS } from "@app/config/run-ui-size";
import { createPageBridges } from "./pages/createPageBridges";

export function openRunUi(): void {
	showUI({
		width: RUN_UI_WIDTHS.compact,
		height: RUN_UI_HEIGHT,
		title: "Bridges Toolkit",
	});
	const pageBridges = createPageBridges({ postToUi });
	const initialPage = LISTED_PAGE_META[0]?.id ?? "index";
	let currentPage: PageId = initialPage;

	const setCurrentPage = (page: PageId): void => {
		currentPage = page;
		pageBridges[currentPage].enter();
	};

	setCurrentPage(initialPage);

	figma.on("selectionchange", () => {
		pageBridges[currentPage].onSelectionChange();
	});
	figma.on("currentpagechange", () => {
		pageBridges[currentPage].onCurrentPageChange();
	});
	figma.on("documentchange", () => {
		pageBridges[currentPage].onDocumentChange();
	});

	figma.ui.onmessage = (message: unknown) => {
		if (!isUiToMainMessage(message)) {
			console.warn("[plugin] Ignored unknown UI message", message);
			return;
		}

		switch (message.type) {
			case "SET_ACTIVE_PAGE":
				setCurrentPage(message.page);
				return;
			case "RESIZE_PLUGIN_UI":
				figma.ui.resize(message.width, message.height);
				return;
			case "CLOSE_PLUGIN":
				figma.closePlugin("Closed from UI");
				return;
			default:
				if (pageBridges[currentPage].handleUiMessage(message)) {
					return;
				}
				console.warn("[plugin] Unhandled UI message", message);
		}
	};
}

function postToUi(message: MainToUiMessage): void {
	figma.ui.postMessage(message);
}
