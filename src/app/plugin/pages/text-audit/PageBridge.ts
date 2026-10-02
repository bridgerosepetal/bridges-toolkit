import type { UiToMainMessage } from "@app/api/messages";
import type { ExtractedTextNode } from "@features/text-audit/model/types";
import { getExtractedTextNodesFromSelection } from "@features/text-audit/api/figma/get-extracted-text-nodes-from-selection";
import {
	getTextAuditFrameGroupId,
	isTextAuditFrameGroupMarked,
	setTextAuditFrameGroupId,
} from "@features/text-audit/api/figma/plugin-data";
import type { CreatePageBridgeOptions, PageBridge } from "../PageBridge";
import { createSelectionCache, getSelectionKey } from "../selection-cache";

function createTextAuditPageBridge(
	options: CreatePageBridgeOptions,
): PageBridge {
	const { postToUi } = options;
	const selectionCache = createSelectionCache(
		getExtractedTextNodesFromSelection,
	);
	let inspectorCache: {
		pageId: string;
		frameGroupCount: number;
		nodes: Array<ExtractedTextNode>;
	} | null = null;
	let lastPostedSelectionKey: string | null = null;
	let isSelectionLocked = false;

	// Walking the whole page for marked frame groups is expensive, so the
	// result is reused until the document or the current page changes.
	const getInspectorNodes = (
		options: { bypassCache?: boolean } = {},
	): { frameGroupCount: number; nodes: Array<ExtractedTextNode> } => {
		const pageId = figma.currentPage.id;

		if (
			options.bypassCache !== true &&
			inspectorCache !== null &&
			inspectorCache.pageId === pageId
		) {
			return inspectorCache;
		}

		const frameGroups = getMarkedFrameGroupNodes(figma.currentPage);
		inspectorCache = {
			pageId,
			frameGroupCount: frameGroups.length,
			nodes: getExtractedTextNodesFromSelection(frameGroups),
		};
		return inspectorCache;
	};

	const clearCaches = (): void => {
		selectionCache.clear();
		inspectorCache = null;
		lastPostedSelectionKey = null;
	};

	const postTextAuditNodes = (
		postOptions: {
			skipIfSameSelection?: boolean;
			bypassCache?: boolean;
		} = {},
	): void => {
		const selection = figma.currentPage.selection;
		const selectionKey = getSelectionKey(selection);

		if (
			postOptions.skipIfSameSelection === true &&
			lastPostedSelectionKey === selectionKey
		) {
			return;
		}

		const inspector = getInspectorNodes({
			bypassCache: postOptions.bypassCache,
		});
		const selectionNodes = selectionCache.get(selection, {
			bypassCache: postOptions.bypassCache,
		});

		postToUi({
			type: "TEXT_AUDIT_NODES",
			nodes: selectionNodes,
			inspectorNodes: inspector.nodes,
			inspectorSelectionNodeIds: selectionNodes.map((node) => node.id),
			frameGroupCount: inspector.frameGroupCount,
		});
		postTextAuditFrameGroupMarkStatus();
		lastPostedSelectionKey = selectionKey;
	};

	const postTextAuditFrameGroupMarkStatus = (): void => {
		const selection = figma.currentPage.selection;
		const frameLikeSelection = selection.filter((node) =>
			isFrameLikeNode(node),
		);
		const isMarked =
			frameLikeSelection.length > 0 &&
			frameLikeSelection.every(isTextAuditFrameGroupMarked);
		const selectedFrameGroupNames = frameLikeSelection
			.filter(isTextAuditFrameGroupMarked)
			.map((node) => node.name);
		const selectedFrameGroupName =
			selection.length === 1 &&
			isFrameLikeNode(selection[0]) &&
			isTextAuditFrameGroupMarked(selection[0])
				? selection[0].name
				: undefined;

		postToUi({
			type: "TEXT_AUDIT_FRAME_GROUP_MARK_STATUS",
			isMarked,
			selectedFrameGroupName,
			selectedFrameGroupNames,
		});
	};

	const toggleFrameGroupMarksOnSelection = (): void => {
		const frameLikeSelection = figma.currentPage.selection.filter((node) =>
			isFrameLikeNode(node),
		);

		if (frameLikeSelection.length === 0) {
			postTextAuditFrameGroupMarkStatus();
			return;
		}

		const frameGroupIds = frameLikeSelection
			.map((node) => getTextAuditFrameGroupId(node))
			.filter((value) => value.length > 0);
		const allShareSameGroup =
			frameGroupIds.length === frameLikeSelection.length &&
			new Set(frameGroupIds).size === 1;

		if (allShareSameGroup) {
			for (const node of frameLikeSelection) {
				setTextAuditFrameGroupId(node, "");
			}
		} else {
			const nextFrameGroupId = createFrameGroupId();
			for (const node of frameLikeSelection) {
				setTextAuditFrameGroupId(node, nextFrameGroupId);
			}
		}

		clearCaches();
		postTextAuditNodes({ bypassCache: true });
	};

	return {
		enter() {
			postTextAuditNodes();
		},
		handleUiMessage(message: UiToMainMessage) {
			if (message.type === "REQUEST_TEXT_AUDIT_NODES") {
				postTextAuditNodes({ bypassCache: true });
				return true;
			}

			if (message.type === "SET_TEXT_AUDIT_SELECTION_LOCK") {
				isSelectionLocked = message.isLocked;
				return true;
			}

			if (message.type === "TOGGLE_TEXT_AUDIT_FRAME_GROUP_MARKS") {
				toggleFrameGroupMarksOnSelection();
				return true;
			}

			return false;
		},
		onSelectionChange() {
			if (isSelectionLocked) {
				return;
			}
			postTextAuditNodes({ skipIfSameSelection: true });
		},
		onCurrentPageChange() {
			if (isSelectionLocked) {
				return;
			}
			postTextAuditNodes({ skipIfSameSelection: true });
		},
		onDocumentChange() {
			clearCaches();
			postTextAuditNodes();
		},
	};
}

function isFrameLikeNode(node: SceneNode): node is SceneNode & BaseNodeMixin {
	return (
		node.type === "FRAME" ||
		node.type === "COMPONENT" ||
		node.type === "INSTANCE" ||
		node.type === "SECTION"
	);
}

export const createPageBridge = createTextAuditPageBridge;

function createFrameGroupId(): string {
	return `frame-group-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function getMarkedFrameGroupNodes(page: PageNode): Array<SceneNode> {
	const frameGroups: Array<SceneNode> = [];

	for (const child of page.children) {
		collectMarkedFrameGroupNodes(child, frameGroups);
	}

	return frameGroups;
}

function collectMarkedFrameGroupNodes(
	node: SceneNode,
	target: Array<SceneNode>,
): void {
	if (isFrameLikeNode(node) && isTextAuditFrameGroupMarked(node)) {
		target.push(node);
	}

	if ("children" in node) {
		for (const child of node.children) {
			collectMarkedFrameGroupNodes(child, target);
		}
	}
}
