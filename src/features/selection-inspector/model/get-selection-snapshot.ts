export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | Array<JsonValue>;
export type JsonObject = {
	[key: string]: JsonValue;
};

export type SelectionNodeTruncation = {
	reason: "size-budget";
	detailLevel: "summary" | "full";
	directChildrenOmitted: number;
	descendantContentTruncated: boolean;
};

export type SelectionNodeSnapshot = {
	id: string;
	name: string;
	type: SceneNode["type"];
	visible: boolean;
	locked: boolean;
	parentId: string | null;
	parentName: string | null;
	childCount: number;
	childrenIncluded: number;
	detailLevel: "summary" | "full";
	data: JsonObject;
	children?: Array<SelectionNodeSnapshot>;
	truncation?: SelectionNodeTruncation;
};

export type SelectionSummary = {
	selectedRoots: number;
	totalNodes: number;
	serializedNodes: number;
	textNodes: number;
	maxDepth: number;
	estimatedSizeBytes: number;
	budgetBytes: number;
	wasTruncated: boolean;
};

export type SelectionSnapshot = {
	format: "figma-selection-snapshot/v2";
	meta: {
		selectionNodeIds: Array<string>;
		selectionNodeNames: Array<string>;
	};
	summary: SelectionSummary;
	nodes: Array<SelectionNodeSnapshot>;
};

export type SelectionSnapshotOptions = {
	budgetBytes?: number;
};

type SerializationResult = {
	node: SelectionNodeSnapshot | null;
	wasTruncated: boolean;
};

type SelectionMetrics = {
	totalNodes: number;
	textNodes: number;
	maxDepth: number;
};

const DEFAULT_BUDGET_BYTES = 2 * 1024 * 1024;
const MINIMUM_BUDGET_BYTES = 1024;
const NUMBER_PRECISION = 10000;
const SUMMARY_TEXT_PREVIEW_LENGTH = 240;

const GEOMETRY_KEYS = [
	"x",
	"y",
	"width",
	"height",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"rotation",
	"constrainProportions",
	"relativeTransform",
	"absoluteTransform",
	"absoluteBoundingBox",
	"absoluteRenderBounds",
	"targetAspectRatio",
] as const;

const APPEARANCE_KEYS = [
	"opacity",
	"blendMode",
	"isMask",
	"maskType",
	"fillStyleId",
	"strokeStyleId",
	"effectStyleId",
	"fills",
	"strokes",
	"effects",
	"backgrounds",
	"strokeWeight",
	"strokeTopWeight",
	"strokeRightWeight",
	"strokeBottomWeight",
	"strokeLeftWeight",
	"strokeAlign",
	"strokeCap",
	"strokeJoin",
	"dashPattern",
	"cornerRadius",
	"topLeftRadius",
	"topRightRadius",
	"bottomLeftRadius",
	"bottomRightRadius",
	"cornerSmoothing",
] as const;

const LAYOUT_KEYS = [
	"clipsContent",
	"layoutMode",
	"layoutWrap",
	"primaryAxisSizingMode",
	"counterAxisSizingMode",
	"primaryAxisAlignItems",
	"counterAxisAlignItems",
	"primaryAxisAlignContent",
	"counterAxisAlignContent",
	"paddingLeft",
	"paddingRight",
	"paddingTop",
	"paddingBottom",
	"itemSpacing",
	"counterAxisSpacing",
	"itemReverseZIndex",
	"strokesIncludedInLayout",
	"overflowDirection",
	"layoutGrids",
	"gridStyleId",
] as const;

const AUTO_LAYOUT_CHILD_KEYS = [
	"layoutAlign",
	"layoutGrow",
	"layoutPositioning",
	"layoutSizingHorizontal",
	"layoutSizingVertical",
	"constraints",
] as const;

const SHAPE_KEYS = [
	"pointCount",
	"innerRadius",
	"arcData",
	"booleanOperation",
	"vectorPaths",
] as const;

const EXPORT_KEYS = ["exportSettings"] as const;
const VARIABLE_KEYS = [
	"boundVariables",
	"resolvedVariableModes",
	"inferredVariables",
] as const;
const PROTOTYPE_KEYS = ["reactions"] as const;

const TEXT_KEYS = [
	"characters",
	"hasMissingFont",
	"fontSize",
	"fontName",
	"fontWeight",
	"textCase",
	"textDecoration",
	"textDecorationStyle",
	"textDecorationOffset",
	"textDecorationThickness",
	"textDecorationColor",
	"textDecorationSkipInk",
	"letterSpacing",
	"lineHeight",
	"leadingTrim",
	"textAlignHorizontal",
	"textAlignVertical",
	"textAutoResize",
	"textTruncation",
	"maxLines",
	"paragraphIndent",
	"paragraphSpacing",
	"listSpacing",
	"hangingPunctuation",
	"hangingList",
	"hyperlink",
	"openTypeFeatures",
	"textStyleId",
	"fillStyleId",
] as const;

const TEXT_SEGMENT_FIELDS = [
	"fontSize",
	"fontName",
	"fontWeight",
	"textDecoration",
	"textDecorationStyle",
	"textDecorationOffset",
	"textDecorationThickness",
	"textDecorationColor",
	"textDecorationSkipInk",
	"textCase",
	"lineHeight",
	"letterSpacing",
	"fills",
	"textStyleId",
	"fillStyleId",
	"listOptions",
	"listSpacing",
	"indentation",
	"paragraphIndent",
	"paragraphSpacing",
	"hyperlink",
	"openTypeFeatures",
	"textStyleOverrides",
] as const;

export function getSelectionSnapshot(
	nodes: readonly SceneNode[],
	options: SelectionSnapshotOptions = {},
): SelectionSnapshot {
	const budgetBytes = Math.max(
		MINIMUM_BUDGET_BYTES,
		options.budgetBytes ?? DEFAULT_BUDGET_BYTES,
	);
	const metrics = collectSelectionMetrics(nodes);
	const snapshot: SelectionSnapshot = {
		format: "figma-selection-snapshot/v2",
		meta: {
			selectionNodeIds: nodes.map((node) => node.id),
			selectionNodeNames: nodes.map((node) => node.name),
		},
		summary: {
			selectedRoots: nodes.length,
			totalNodes: metrics.totalNodes,
			serializedNodes: 0,
			textNodes: metrics.textNodes,
			maxDepth: metrics.maxDepth,
			estimatedSizeBytes: 0,
			budgetBytes,
			wasTruncated: false,
		},
		nodes: [],
	};

	let wasTruncated = false;

	for (const node of nodes) {
		const remainingBudget = Math.max(
			0,
			budgetBytes - estimateJsonBytes(snapshot),
		);
		const result = serializeNodeWithinBudget(node, remainingBudget);
		if (result.node === null) {
			wasTruncated = true;
			break;
		}

		snapshot.nodes.push(result.node);
		if (estimateJsonBytes(snapshot) > budgetBytes) {
			snapshot.nodes.pop();
			wasTruncated = true;
			break;
		}

		if (result.wasTruncated) {
			wasTruncated = true;
		}
	}

	snapshot.summary.serializedNodes = countSerializedNodes(snapshot.nodes);
	finalizeSnapshotSummary(snapshot, budgetBytes, wasTruncated);

	return snapshot;
}

function serializeNodeWithinBudget(
	node: SceneNode,
	budgetBytes: number,
): SerializationResult {
	const richNode = createSelectionNodeSnapshot(node, "full");
	if (estimateJsonBytes(richNode) > budgetBytes) {
		const summaryNode = createSelectionNodeSnapshot(node, "summary");
		if (estimateJsonBytes(summaryNode) > budgetBytes) {
			return {
				node: null,
				wasTruncated: true,
			};
		}

		return {
			node: applyChildrenAndTruncation(summaryNode, [], {
				directChildrenOmitted: getChildCount(node),
				descendantContentTruncated: getChildCount(node) > 0,
			}),
			wasTruncated: true,
		};
	}

	if (!hasChildren(node) || node.children.length === 0) {
		return {
			node: richNode,
			wasTruncated: false,
		};
	}

	const includedChildren: Array<SelectionNodeSnapshot> = [];
	let descendantContentTruncated = false;

	for (let index = 0; index < node.children.length; index += 1) {
		const child = node.children[index];
		const currentNode = applyChildrenAndTruncation(richNode, includedChildren, {
			directChildrenOmitted: 0,
			descendantContentTruncated,
		});
		const remainingBudget = Math.max(
			0,
			budgetBytes - estimateJsonBytes(currentNode),
		);
		if (remainingBudget <= 0) {
			return {
				node: applyChildrenAndTruncation(richNode, includedChildren, {
					directChildrenOmitted: node.children.length - index,
					descendantContentTruncated: true,
				}),
				wasTruncated: true,
			};
		}

		const childResult = serializeNodeWithinBudget(child, remainingBudget);
		if (childResult.node === null) {
			return {
				node: applyChildrenAndTruncation(richNode, includedChildren, {
					directChildrenOmitted: node.children.length - index,
					descendantContentTruncated: true,
				}),
				wasTruncated: true,
			};
		}

		const candidateChildren = [...includedChildren, childResult.node];
		const candidateNode = applyChildrenAndTruncation(richNode, candidateChildren, {
			directChildrenOmitted: 0,
			descendantContentTruncated:
				descendantContentTruncated || childResult.wasTruncated,
		});
		if (estimateJsonBytes(candidateNode) > budgetBytes) {
			return {
				node: applyChildrenAndTruncation(richNode, includedChildren, {
					directChildrenOmitted: node.children.length - index,
					descendantContentTruncated: true,
				}),
				wasTruncated: true,
			};
		}

		includedChildren.push(childResult.node);
		descendantContentTruncated =
			descendantContentTruncated || childResult.wasTruncated;
	}

	return {
		node: applyChildrenAndTruncation(richNode, includedChildren, {
			directChildrenOmitted: 0,
			descendantContentTruncated,
		}),
		wasTruncated: descendantContentTruncated,
	};
}

function createSelectionNodeSnapshot(
	node: SceneNode,
	detailLevel: "summary" | "full",
): SelectionNodeSnapshot {
	return {
		id: node.id,
		name: node.name,
		type: node.type,
		visible: node.visible,
		locked: node.locked,
		parentId: isSceneNode(node.parent) ? node.parent.id : null,
		parentName: isSceneNode(node.parent) ? node.parent.name : null,
		childCount: getChildCount(node),
		childrenIncluded: 0,
		detailLevel,
		data:
			detailLevel === "full"
				? createFullNodeData(node)
				: createSummaryNodeData(node),
	};
}

function createFullNodeData(node: SceneNode): JsonObject {
	const data: JsonObject = {};

	assignSection(data, "geometry", pickNodeProps(node, GEOMETRY_KEYS));
	assignSection(data, "appearance", pickNodeProps(node, APPEARANCE_KEYS));
	assignSection(data, "layout", pickNodeProps(node, LAYOUT_KEYS));
	assignSection(data, "autoLayoutChild", pickNodeProps(node, AUTO_LAYOUT_CHILD_KEYS));
	assignSection(data, "shape", pickNodeProps(node, SHAPE_KEYS));
	assignSection(data, "prototype", pickNodeProps(node, PROTOTYPE_KEYS));
	assignSection(data, "exports", pickNodeProps(node, EXPORT_KEYS));
	assignSection(data, "variables", pickNodeProps(node, VARIABLE_KEYS));
	assignSection(data, "text", createTextNodeData(node, true));
	assignSection(data, "component", createComponentNodeData(node));

	return data;
}

function createSummaryNodeData(node: SceneNode): JsonObject {
	const data: JsonObject = {};

	assignSection(
		data,
		"geometry",
		pickNodeProps(node, [
			"x",
			"y",
			"width",
			"height",
			"rotation",
			"absoluteBoundingBox",
			"absoluteRenderBounds",
		]),
	);
	assignSection(
		data,
		"appearance",
		pickNodeProps(node, [
			"opacity",
			"blendMode",
			"fills",
			"strokes",
			"effects",
			"cornerRadius",
			"topLeftRadius",
			"topRightRadius",
			"bottomLeftRadius",
			"bottomRightRadius",
		]),
	);
	assignSection(
		data,
		"layout",
		pickNodeProps(node, ["clipsContent", "layoutMode", "itemSpacing"]),
	);
	assignSection(data, "text", createTextNodeData(node, false));

	return data;
}

function createTextNodeData(
	node: SceneNode,
	includeFullCharacters: boolean,
): JsonObject {
	if (node.type !== "TEXT") {
		return {};
	}

	const textData = pickNodeProps(node, TEXT_KEYS);
	if (!includeFullCharacters) {
		delete textData.characters;
		textData.charactersPreview = truncate(
			node.characters,
			SUMMARY_TEXT_PREVIEW_LENGTH,
		);
		textData.characterCount = node.characters.length;
	}

	if (shouldIncludeStyledTextSegments(node)) {
		const segments = node.getStyledTextSegments([...TEXT_SEGMENT_FIELDS]);
		const sanitizedSegments = sanitizeValue(segments);
		if (sanitizedSegments !== undefined) {
			textData.segments = sanitizedSegments;
		}
	}

	return textData;
}

function createComponentNodeData(node: SceneNode): JsonObject {
	const componentData: JsonObject = {};

	if ("componentPropertyDefinitions" in node) {
		assignValue(
			componentData,
			"componentPropertyDefinitions",
			sanitizeValue(node.componentPropertyDefinitions),
		);
	}

	if ("componentProperties" in node) {
		assignValue(
			componentData,
			"componentProperties",
			sanitizeValue(node.componentProperties),
		);
	}

	if ("variantProperties" in node) {
		assignValue(
			componentData,
			"variantProperties",
			sanitizeValue(node.variantProperties),
		);
	}

	if ("variantGroupProperties" in node) {
		assignValue(
			componentData,
			"variantGroupProperties",
			sanitizeValue(node.variantGroupProperties),
		);
	}

	if ("scaleFactor" in node) {
		assignValue(componentData, "scaleFactor", sanitizeValue(node.scaleFactor));
	}

	if ("isExposedInstance" in node) {
		assignValue(
			componentData,
			"isExposedInstance",
			sanitizeValue(node.isExposedInstance),
		);
	}

	if ("overrides" in node) {
		assignValue(componentData, "overrides", sanitizeValue(node.overrides));
	}

	if ("mainComponent" in node && node.mainComponent !== null) {
		assignValue(componentData, "mainComponent", {
			id: node.mainComponent.id,
			name: node.mainComponent.name,
			key: node.mainComponent.key,
			type: node.mainComponent.type,
		});
	}

	return componentData;
}

function applyChildrenAndTruncation(
	baseNode: SelectionNodeSnapshot,
	children: Array<SelectionNodeSnapshot>,
	options: {
		directChildrenOmitted: number;
		descendantContentTruncated: boolean;
	},
): SelectionNodeSnapshot {
	const nextNode: SelectionNodeSnapshot = {
		...baseNode,
		childrenIncluded: children.length,
	};

	if (children.length > 0) {
		nextNode.children = children;
	}

	if (
		baseNode.detailLevel === "summary" ||
		options.directChildrenOmitted > 0 ||
		options.descendantContentTruncated
	) {
		nextNode.truncation = {
			reason: "size-budget",
			detailLevel: baseNode.detailLevel,
			directChildrenOmitted: options.directChildrenOmitted,
			descendantContentTruncated: options.descendantContentTruncated,
		};
	}

	return nextNode;
}

function collectSelectionMetrics(
	nodes: readonly SceneNode[],
): SelectionMetrics {
	const metrics: SelectionMetrics = {
		totalNodes: 0,
		textNodes: 0,
		maxDepth: 0,
	};

	for (const node of nodes) {
		collectNodeMetrics(node, 1, metrics);
	}

	return metrics;
}

function collectNodeMetrics(
	node: SceneNode,
	depth: number,
	metrics: SelectionMetrics,
): void {
	metrics.totalNodes += 1;
	if (node.type === "TEXT") {
		metrics.textNodes += 1;
	}
	metrics.maxDepth = Math.max(metrics.maxDepth, depth);

	if (!hasChildren(node)) {
		return;
	}

	for (const child of node.children) {
		collectNodeMetrics(child, depth + 1, metrics);
	}
}

function countSerializedNodes(nodes: readonly SelectionNodeSnapshot[]): number {
	let total = 0;

	for (const node of nodes) {
		total += 1;
		if (node.children !== undefined) {
			total += countSerializedNodes(node.children);
		}
	}

	return total;
}

function pickNodeProps(
	node: SceneNode,
	keys: readonly string[],
): JsonObject {
	const result: JsonObject = {};

	for (const key of keys) {
		const value = readProperty(node, key);
		assignValue(result, key, sanitizeValue(value));
	}

	return result;
}

function assignSection(
	target: JsonObject,
	key: string,
	value: JsonObject,
): void {
	if (Object.keys(value).length === 0) {
		return;
	}

	target[key] = value;
}

function assignValue(
	target: JsonObject,
	key: string,
	value: JsonValue | undefined,
): void {
	if (value === undefined) {
		return;
	}

	target[key] = value;
}

function readProperty(source: object, key: string): unknown {
	if (!(key in source)) {
		return undefined;
	}

	return (source as Record<string, unknown>)[key];
}

function sanitizeValue(value: unknown): JsonValue | undefined {
	if (value === undefined) {
		return undefined;
	}

	if (value === null) {
		return null;
	}

	if (typeof value === "string" || typeof value === "boolean") {
		return value;
	}

	if (typeof value === "number") {
		if (!Number.isFinite(value)) {
			return undefined;
		}
		return roundNumber(value);
	}

	if (typeof value === "symbol") {
		return "mixed";
	}

	if (Array.isArray(value)) {
		const items = value
			.map((item) => sanitizeValue(item))
			.filter((item): item is JsonValue => item !== undefined);
		return items;
	}

	if (isColorRecord(value)) {
		const color: JsonObject = {
			r: roundNumber(value.r),
			g: roundNumber(value.g),
			b: roundNumber(value.b),
			hex: rgbToHex(value),
		};

		if ("a" in value && typeof value.a === "number") {
			color.a = roundNumber(value.a);
		}

		return color;
	}

	if (typeof value === "object") {
		const result: JsonObject = {};
		for (const [entryKey, entryValue] of Object.entries(value)) {
			assignValue(result, entryKey, sanitizeValue(entryValue));
		}
		return result;
	}

	return undefined;
}

function shouldIncludeStyledTextSegments(node: TextNode): boolean {
	return (
		isMixedValue(node.fontSize) ||
		isMixedValue(node.fontName) ||
		isMixedValue(node.fontWeight) ||
		isMixedValue(node.textCase) ||
		isMixedValue(node.textDecoration) ||
		isMixedValue(node.textDecorationStyle) ||
		isMixedValue(node.textDecorationOffset) ||
		isMixedValue(node.textDecorationThickness) ||
		isMixedValue(node.textDecorationColor) ||
		isMixedValue(node.textDecorationSkipInk) ||
		isMixedValue(node.letterSpacing) ||
		isMixedValue(node.lineHeight) ||
		isMixedValue(node.leadingTrim) ||
		isMixedValue(node.hyperlink) ||
		isMixedValue(node.openTypeFeatures) ||
		isMixedValue(node.fills) ||
		isMixedValue(node.textStyleId) ||
		isMixedValue(node.fillStyleId)
	);
}

function finalizeSnapshotSummary(
	snapshot: SelectionSnapshot,
	budgetBytes: number,
	wasTruncated: boolean,
): void {
	let estimatedSizeBytes = 0;
	let nextWasTruncated = wasTruncated;

	for (let iteration = 0; iteration < 3; iteration += 1) {
		snapshot.summary.wasTruncated = nextWasTruncated;
		snapshot.summary.estimatedSizeBytes = estimatedSizeBytes;
		estimatedSizeBytes = estimateJsonBytes(snapshot);
		nextWasTruncated = nextWasTruncated || estimatedSizeBytes > budgetBytes;
	}

	snapshot.summary.wasTruncated = nextWasTruncated;
	snapshot.summary.estimatedSizeBytes = estimatedSizeBytes;
}

function estimateJsonBytes(value: unknown): number {
	const json = JSON.stringify(value);

	if (typeof TextEncoder === "undefined") {
		return json.length;
	}

	return new TextEncoder().encode(json).length;
}

function roundNumber(value: number): number {
	return Math.round(value * NUMBER_PRECISION) / NUMBER_PRECISION;
}

function rgbToHex(color: { r: number; g: number; b: number; a?: number }): string {
	const channels = [color.r, color.g, color.b].map((channel) =>
		toHexChannel(channel),
	);
	if (typeof color.a === "number" && color.a < 1) {
		channels.push(toHexChannel(color.a));
	}
	return `#${channels.join("")}`;
}

function toHexChannel(value: number): string {
	const normalized = Math.max(0, Math.min(255, Math.round(value * 255)));
	return normalized.toString(16).padStart(2, "0").toUpperCase();
}

function hasChildren(node: SceneNode): node is SceneNode & ChildrenMixin {
	return "children" in node;
}

function getChildCount(node: SceneNode): number {
	return hasChildren(node) ? node.children.length : 0;
}

function isMixedValue(value: unknown): boolean {
	return typeof value === "symbol";
}

function isColorRecord(value: unknown): value is {
	r: number;
	g: number;
	b: number;
	a?: number;
} {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const typed = value as Record<string, unknown>;
	return (
		typeof typed.r === "number" &&
		typeof typed.g === "number" &&
		typeof typed.b === "number"
	);
}

function isSceneNode(value: BaseNode | null): value is SceneNode {
	return value !== null && "id" in value && "name" in value && "type" in value;
}

function truncate(value: string, maxLength: number): string {
	if (value.length <= maxLength) {
		return value;
	}
	return `${value.slice(0, maxLength - 3)}...`;
}
