import type { ExtractedTextNode } from "../../model/types";
import {
	getTextAuditFrameGroupId,
	isTextAuditFrameGroupMarked,
} from "./plugin-data";

type FrameLikeNode = SceneNode & {
	width: number;
	height: number;
	absoluteTransform: Transform;
};

type PluginDataSceneNode = SceneNode & BaseNodeMixin;

type ExtractedTextNodeSource = {
	textNode: TextNode;
	frameGroupNode: PluginDataSceneNode | null;
};

const FRAME_LIKE_TYPES = new Set<SceneNode["type"]>([
	"FRAME",
	"COMPONENT",
	"INSTANCE",
	"SECTION",
]);
export function getExtractedTextNodesFromSelection(
	selection: readonly SceneNode[],
): Array<ExtractedTextNode> {
	const sources: Array<ExtractedTextNodeSource> = [];

	for (const node of selection) {
		const scopedFrameGroupNode = getScopedFrameGroupNode(node);
		collectTextNodeSources(
			node,
			sources,
			scopedFrameGroupNode,
		);
	}

	return getUniqueExtractedTextNodes(sources.map(toExtractedTextNode)).sort(
		compareExtractedTextNodes,
	);
}

function collectTextNodeSources(
	node: SceneNode,
	target: Array<ExtractedTextNodeSource>,
	scopedFrameGroupNode: PluginDataSceneNode | null,
): void {
	const nodeFrameGroup = getScopedFrameGroupNode(node);
	if (nodeFrameGroup !== null) {
		scopedFrameGroupNode = nodeFrameGroup;
	}

	if (node.type === "TEXT") {
		if (scopedFrameGroupNode !== null) {
			target.push({
				textNode: node,
				frameGroupNode: scopedFrameGroupNode,
			});
			return;
		}

		target.push({
			textNode: node,
			frameGroupNode: findNearestMarkedFrameGroupAncestor(node),
		});
	}

	if ("children" in node) {
		for (const child of node.children) {
			collectTextNodeSources(child, target, scopedFrameGroupNode);
		}
	}
}

function getUniqueExtractedTextNodes(
	nodes: Array<ExtractedTextNode>,
): Array<ExtractedTextNode> {
	const nodesByScope = new Map<string, ExtractedTextNode>();

	for (const node of nodes) {
		nodesByScope.set(
			`${node.id}|${node.context?.frameGroupId ?? "__ungrouped__"}`,
			node,
		);
	}

	return Array.from(nodesByScope.values());
}

function toExtractedTextNode(source: ExtractedTextNodeSource): ExtractedTextNode {
	const { textNode } = source;
	const frameNode = findFrameLikeAncestor(textNode) ?? textNode;
	const rootFrameNode = findRootFrameLikeAncestor(textNode) ?? frameNode;
	const frameGroupNode = source.frameGroupNode;
	const textPosition = readAbsolutePosition(textNode);
	const framePosition = readAbsolutePosition(frameNode as FrameLikeNode);
	const frameGroupPosition =
		frameGroupNode !== null && hasFrameGeometry(frameGroupNode)
			? readAbsolutePosition(frameGroupNode)
			: null;
	const fontMeta = readFontMeta(textNode);

	return {
		id: textNode.id,
		frameId: frameNode.id,
		frameName: frameNode.name,
		text: textNode.characters,
		x: textPosition.x - framePosition.x,
		y: textPosition.y - framePosition.y,
		width: textNode.width,
		height: textNode.height,
		frameWidth: (frameNode as FrameLikeNode).width,
		frameHeight: (frameNode as FrameLikeNode).height,
		style: {
			"font-size": readFontSize(textNode),
			"line-height": readLineHeight(textNode),
			"letter-spacing": readLetterSpacing(textNode),
			"font-family": fontMeta.family,
			"font-weight": fontMeta.weight,
			"text-align": readTextAlign(textNode),
			"text-transform": readTextTransform(textNode),
			"text-decoration": readTextDecoration(textNode),
		},
		context: {
			parentPath: buildParentPath(textNode, frameNode),
			rootFrameName: rootFrameNode.name,
			frameGroupId:
				frameGroupNode === null
					? undefined
					: getTextAuditFrameGroupId(frameGroupNode),
			frameGroupName: frameGroupNode?.name,
			frameGroupCenterXRatio:
				frameGroupNode !== null &&
				hasFrameGeometry(frameGroupNode) &&
				frameGroupPosition !== null
					? (textPosition.x - frameGroupPosition.x + textNode.width / 2) /
						Math.max(frameGroupNode.width, 1)
					: undefined,
			frameGroupCenterYRatio:
				frameGroupNode !== null &&
				hasFrameGeometry(frameGroupNode) &&
				frameGroupPosition !== null
					? (textPosition.y - frameGroupPosition.y + textNode.height / 2) /
						Math.max(frameGroupNode.height, 1)
					: undefined,
			frameGroupTreeDepth:
				frameGroupNode === null
					? undefined
					: getTreeDepthFromAncestor(textNode, frameGroupNode),
			componentId: findComponentContextId(textNode),
		},
	};
}

function findFrameLikeAncestor(node: SceneNode): FrameLikeNode | null {
	let current: BaseNode | null = node.parent;

	while (current !== null && current.type !== "PAGE") {
		if (isSceneNode(current) && FRAME_LIKE_TYPES.has(current.type)) {
			return current as FrameLikeNode;
		}
		current = current.parent;
	}

	let fallback: BaseNode | null = node.parent;
	while (fallback !== null && fallback.type !== "PAGE") {
		if (isSceneNode(fallback) && hasFrameGeometry(fallback)) {
			return fallback as FrameLikeNode;
		}
		fallback = fallback.parent;
	}

	return null;
}

function findRootFrameLikeAncestor(node: SceneNode): FrameLikeNode | null {
	let current: BaseNode | null = node.parent;
	let lastFrameLike: FrameLikeNode | null = null;

	while (current !== null && current.type !== "PAGE") {
		if (isSceneNode(current) && FRAME_LIKE_TYPES.has(current.type)) {
			lastFrameLike = current as FrameLikeNode;
		}
		current = current.parent;
	}

	if (lastFrameLike !== null) {
		return lastFrameLike;
	}

	let fallback: BaseNode | null = node.parent;
	let lastGeometryNode: FrameLikeNode | null = null;

	while (fallback !== null && fallback.type !== "PAGE") {
		if (isSceneNode(fallback) && hasFrameGeometry(fallback)) {
			lastGeometryNode = fallback as FrameLikeNode;
		}
		fallback = fallback.parent;
	}

	return lastGeometryNode;
}

function getScopedFrameGroupNode(node: SceneNode): PluginDataSceneNode | null {
	if (
		isFrameLikeNode(node) &&
		"getPluginData" in node &&
		typeof node.getPluginData === "function" &&
		isTextAuditFrameGroupMarked(node)
	) {
		return node;
	}

	return null;
}

function findNearestMarkedFrameGroupAncestor(
	node: SceneNode,
): PluginDataSceneNode | null {
	let current: BaseNode | null = node.parent;

	while (current !== null && current.type !== "PAGE") {
		if (
			isSceneNode(current) &&
			FRAME_LIKE_TYPES.has(current.type) &&
			"getPluginData" in current &&
			typeof current.getPluginData === "function" &&
			isTextAuditFrameGroupMarked(current as PluginDataSceneNode)
		) {
			return current as PluginDataSceneNode;
		}
		current = current.parent;
	}

	return null;
}

function getTreeDepthFromAncestor(
	node: BaseNode,
	ancestor: BaseNode,
): number | undefined {
	let depth = 0;
	let current: BaseNode | null = node;

	while (current !== null && current !== ancestor && current.type !== "PAGE") {
		current = current.parent;
		depth += 1;
	}

	if (current !== ancestor) {
		return undefined;
	}

	return depth;
}

function buildParentPath(
	textNode: TextNode,
	frameNode: SceneNode,
): Array<string> | undefined {
	const names: Array<string> = [];
	let current: BaseNode | null = textNode.parent;

	while (current !== null && current !== frameNode && current.type !== "PAGE") {
		if ("name" in current && typeof current.name === "string") {
			names.push(current.name);
		}
		current = current.parent;
	}

	if (names.length === 0) {
		return undefined;
	}

	return names.reverse();
}

function findComponentContextId(textNode: TextNode): string | undefined {
	let current: BaseNode | null = textNode.parent;

	while (current !== null && current.type !== "PAGE") {
		if (isSceneNode(current)) {
			if (current.type === "INSTANCE" || current.type === "COMPONENT") {
				return current.id;
			}
		}
		current = current.parent;
	}

	return undefined;
}

function readAbsolutePosition(node: { absoluteTransform: Transform }): {
	x: number;
	y: number;
} {
	return {
		x: node.absoluteTransform[0][2],
		y: node.absoluteTransform[1][2],
	};
}

function readFontSize(textNode: TextNode): number | undefined {
	const fontSize = textNode.fontSize;
	return typeof fontSize === "number" ? fontSize : undefined;
}

function readLetterSpacing(textNode: TextNode): string | undefined {
	const letterSpacing = textNode.letterSpacing;

	if (
		typeof letterSpacing !== "object" ||
		letterSpacing === null ||
		!("value" in letterSpacing) ||
		!("unit" in letterSpacing)
	) {
		return undefined;
	}

	const value = Number(letterSpacing.value);
	if (Number.isNaN(value)) {
		return undefined;
	}

	if (letterSpacing.unit === "PERCENT") {
		return `${value}%`;
	}

	if (letterSpacing.unit === "PIXELS") {
		return `${value}px`;
	}

	return String(value);
}

function readLineHeight(textNode: TextNode): string | undefined {
	const lineHeight = textNode.lineHeight;

	if (
		typeof lineHeight !== "object" ||
		lineHeight === null ||
		!("unit" in lineHeight)
	) {
		return undefined;
	}

	if (lineHeight.unit === "AUTO") {
		return "auto";
	}

	if (!("value" in lineHeight)) {
		return undefined;
	}

	const value = Number(lineHeight.value);
	if (Number.isNaN(value)) {
		return undefined;
	}

	if (lineHeight.unit === "PIXELS") {
		return `${value}px`;
	}

	if (lineHeight.unit === "PERCENT") {
		return `${value}%`;
	}

	return String(value);
}

function readFontMeta(textNode: TextNode): {
	family?: string;
	weight?: number;
} {
	const fontName = textNode.fontName;

	if (
		typeof fontName !== "object" ||
		fontName === null ||
		!("family" in fontName) ||
		!("style" in fontName)
	) {
		return {};
	}

	return {
		family: fontName.family,
		weight: parseFontWeight(fontName.style),
	};
}

function readTextAlign(textNode: TextNode): string | undefined {
	const value = textNode.textAlignHorizontal;

	if (typeof value !== "string") {
		return undefined;
	}

	return value.toLowerCase();
}

function readTextTransform(textNode: TextNode): string | undefined {
	const value = textNode.textCase;
	return normalizeFigmaKeyword(value);
}

function readTextDecoration(textNode: TextNode): string | undefined {
	const value = textNode.textDecoration;
	return normalizeFigmaKeyword(value);
}

function normalizeFigmaKeyword(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	if (value === "ORIGINAL" || value === "NONE") {
		return value.toLowerCase();
	}

	return value.toLowerCase().replace(/_/g, "-");
}

function parseFontWeight(styleName: string): number | undefined {
	const numericMatch = styleName.match(/\b([1-9]00)\b/);
	if (numericMatch !== null) {
		return Number(numericMatch[1]);
	}

	const normalized = styleName.toLowerCase();

	if (normalized.includes("thin")) {
		return 100;
	}
	if (
		normalized.includes("extra light") ||
		normalized.includes("extralight") ||
		normalized.includes("ultra light") ||
		normalized.includes("ultralight")
	) {
		return 200;
	}
	if (normalized.includes("light")) {
		return 300;
	}
	if (
		normalized.includes("regular") ||
		normalized.includes("normal") ||
		normalized.includes("book")
	) {
		return 400;
	}
	if (normalized.includes("medium")) {
		return 500;
	}
	if (normalized.includes("semi bold") || normalized.includes("semibold")) {
		return 600;
	}
	if (normalized.includes("bold")) {
		if (
			normalized.includes("extra bold") ||
			normalized.includes("extrabold") ||
			normalized.includes("ultra bold") ||
			normalized.includes("ultrabold")
		) {
			return 800;
		}

		return 700;
	}
	if (normalized.includes("black") || normalized.includes("heavy")) {
		return 900;
	}

	return undefined;
}

function hasFrameGeometry(node: SceneNode): node is FrameLikeNode {
	return (
		"width" in node &&
		typeof node.width === "number" &&
		"height" in node &&
		typeof node.height === "number" &&
		"absoluteTransform" in node
	);
}

function isFrameLikeNode(node: SceneNode): node is PluginDataSceneNode {
	return FRAME_LIKE_TYPES.has(node.type) && "getPluginData" in node;
}

function isSceneNode(node: BaseNode): node is SceneNode {
	return "id" in node && "name" in node && "type" in node;
}

function compareExtractedTextNodes(
	a: ExtractedTextNode,
	b: ExtractedTextNode,
): number {
	return (
		a.frameName.localeCompare(b.frameName) ||
		a.y - b.y ||
		a.x - b.x ||
		a.id.localeCompare(b.id)
	);
}
