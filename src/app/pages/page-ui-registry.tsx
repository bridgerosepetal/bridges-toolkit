import React from "react";
import type { UiBridge } from "@shared/api/UiBridge";
import type { PageController, Render } from "@shared/lib/PageController";
import type { PageId } from "@shared/config/PageId";
import type { RunUiSize } from "@app/config/run-ui-size";
import { PAGE_CONFIG as FRAME_TEXT_EXTRACTOR_PAGE_CONFIG } from "@pages/frame-text-extractor/ui/page.config";
import {
	createPageController as createFrameTextExtractorPageController,
} from "@pages/frame-text-extractor/ui/PageController";
import { FrameTextExtractorPage } from "@pages/frame-text-extractor/ui/Page";
import { PAGE_CONFIG as INDEX_PAGE_CONFIG } from "@pages/index/ui/page.config";
import { createPageController as createIndexPageController } from "@pages/index/ui/PageController";
import { IndexPage } from "@pages/index/ui/Page";

import { PAGE_CONFIG as TEST_PAGE_CONFIG } from "@pages/test-page/ui/page.config";
import { createPageController as createTestPageController } from "@pages/test-page/ui/PageController";
import { TestPage } from "@pages/test-page/ui/Page";
import { PAGE_CONFIG as TEXT_AUDIT_PAGE_CONFIG } from "@pages/text-audit/ui/page.config";
import {
	createPageController as createTextAuditPageController,
	type Controller as TextAuditController,
} from "@pages/text-audit/ui/PageController";
import { TextAuditPage } from "@pages/text-audit/ui/Page";

export type UiPageRenderContext = {
	title: string;
	onGoToPage: (page: PageId) => void;
	onClose: () => void;
	render: Render;
	windowSize: RunUiSize;
};

export type UiPageRuntime = {
	id: PageId;
	name: string;
	isListed: boolean;
	controller: PageController;
	renderPage: (context: UiPageRenderContext) => React.JSX.Element;
};

export function createUiPageRuntimes(
	bridge: UiBridge,
): Record<PageId, UiPageRuntime> {
	const runtimes = [
		createIndexRuntime(),
		createFrameTextExtractorRuntime(bridge),
		createTextAuditRuntime(bridge),
		createTestPageRuntime(),
	];

	return Object.fromEntries(
		runtimes.map((runtime) => [runtime.id, runtime]),
	) as Record<PageId, UiPageRuntime>;
}

function createIndexRuntime(): UiPageRuntime {
	const controller = createIndexPageController();

	return {
		id: INDEX_PAGE_CONFIG.id,
		name: INDEX_PAGE_CONFIG.name,
		isListed: INDEX_PAGE_CONFIG.isListed,
		controller,
		renderPage() {
			return <IndexPage />;
		},
	};
}


function createFrameTextExtractorRuntime(bridge: UiBridge): UiPageRuntime {
	const controller = createFrameTextExtractorPageController(bridge);

	return {
		id: FRAME_TEXT_EXTRACTOR_PAGE_CONFIG.id,
		name: FRAME_TEXT_EXTRACTOR_PAGE_CONFIG.name,
		isListed: FRAME_TEXT_EXTRACTOR_PAGE_CONFIG.isListed,
		controller,
		renderPage(context) {
			return (
				<FrameTextExtractorPage
					status={controller.getViewModel().status}
					snapshot={controller.getViewModel().snapshot}
					onRefresh={controller.getActions(context.render).onRefresh}
					onCopyAll={controller.getActions(context.render).onCopyAll}
					onClose={context.onClose}
				/>
			);
		},
	};
}

function createTextAuditRuntime(bridge: UiBridge): UiPageRuntime {
	const controller: TextAuditController = createTextAuditPageController(bridge);

	return {
		id: TEXT_AUDIT_PAGE_CONFIG.id,
		name: TEXT_AUDIT_PAGE_CONFIG.name,
		isListed: TEXT_AUDIT_PAGE_CONFIG.isListed,
		controller,
		renderPage(context) {
			const model = controller.getViewModel();
			const actions = controller.getActions(context.render);

			return (
				<TextAuditPage
					model={model}
					inspectorModel={controller.getInspectorViewModel()}
					frameGroupCount={controller.getFrameGroupCount()}
					windowSize={context.windowSize}
					isSelectionLocked={controller.getIsSelectionLocked()}
					isFrameGroupMarkedSelection={controller.getIsFrameGroupMarkedSelection()}
					selectedFrameGroupName={controller.getSelectedFrameGroupName()}
					selectedFrameGroupNames={controller.getSelectedFrameGroupNames()}
					selectedPropertyNames={controller.getSelectedPropertyNames()}
					onRefresh={actions.onRefresh}
					onSetSelectionLocked={actions.onSetSelectionLocked}
					onToggleFrameGroupMarks={actions.onToggleFrameGroupMarks}
					onSetPropertyEnabled={actions.onSetPropertyEnabled}
				/>
			);
		},
	};
}

function createTestPageRuntime(): UiPageRuntime {
	const controller = createTestPageController();

	return {
		id: TEST_PAGE_CONFIG.id,
		name: TEST_PAGE_CONFIG.name,
		isListed: TEST_PAGE_CONFIG.isListed,
		controller,
		renderPage(context) {
			return (
				<TestPage
					onBack={() =>
						context.onGoToPage(INDEX_PAGE_CONFIG.id)
					}
					onClose={context.onClose}
				/>
			);
		},
	};
}
