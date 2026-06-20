import type { UiToMainMessage } from "@app/api/messages";
import type { ExtractedTextNode } from "@features/text-audit/model/types";
import { getExtractedTextNodesFromSelection } from "@features/text-audit/api/figma/get-extracted-text-nodes-from-selection";
import {
	getTextAuditFrameGroupId,
	isTextAuditFrameGroupMarked,
	setTextAuditFrameGroupId,
} from "@features/text-audit/api/figma/plugin-data";
import type { CreatePageBridgeOptions, PageBridge } from "../PageBridge";

const MAX_CACHE_SIZE = 10;

function createTextAuditPageBridge(
	options: CreatePageBridgeOptions,
): PageBridge {
	const { postToUi } = options;
	const cache = new Map<string, Array<ExtractedTextNode>>();
	let lastPostedSelectionKey: string | null = null;
	let isSelectionLocked = false;

	const getSelectionKey = (selection: readonly SceneNode[]): string => {
		if (selection.length === 0) {
			return "__empty__";
		}

		return selection
			.map((node) => node.id)
			.sort()
			.join("|");
	};

	const getNodesForSelection = (
		selection: readonly SceneNode[],
		options: { bypassCache?: boolean } = {},
	): Array<ExtractedTextNode> => {
		const key = getSelectionKey(selection);
		const cached = options.bypassCache === true ? undefined : cache.get(key);

		if (cached !== undefined) {
			cache.delete(key);
			cache.set(key, cached);
			return cached;
		}

		const nodes = getExtractedTextNodesFromSelection(selection);
		cache.set(key, nodes);

		if (cache.size > MAX_CACHE_SIZE) {
			const oldestKey = cache.keys().next().value as string | undefined;
			if (oldestKey !== undefined) {
				cache.delete(oldestKey);
			}
		}

		return nodes;
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

		const frameGroups = getMarkedFrameGroupNodes(figma.currentPage);
		const selectionNodes = getNodesForSelection(selection, {
			bypassCache: postOptions.bypassCache,
		});

		postToUi({
			type: "TEXT_AUDIT_NODES",
			nodes: selectionNodes,
			inspectorNodes: getUniqueExtractedTextNodes(
				getExtractedTextNodesFromSelection(frameGroups),
			),
			inspectorSelectionNodeIds: selectionNodes.map((node) => node.id),
			frameGroupCount: frameGroups.length,
		});
		postTextAuditFrameGroupMarkStatus();
		lastPostedSelectionKey = selectionKey;
	};

	const postTextAuditFrameGroupMarkStatus = (): void => {
		const selection = figma.currentPage.selection;
		const frameLikeSelection = selection.filter((node) => isFrameLikeNode(node));
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

		cache.clear();
		lastPostedSelectionKey = null;
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
			cache.clear();
			lastPostedSelectionKey = null;
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

function getUniqueExtractedTextNodes(
	nodes: Array<ExtractedTextNode>,
): Array<ExtractedTextNode> {
	const nodesById = new Map<string, ExtractedTextNode>();

	for (const node of nodes) {
		nodesById.set(
			`${node.id}|${node.context?.frameGroupId ?? "__ungrouped__"}`,
			node,
		);
	}

	return Array.from(nodesById.values());
}
