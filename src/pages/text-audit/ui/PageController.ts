import {
	type PageController,
	type Render,
} from "@shared/lib/PageController";
import type { UiBridge } from "@shared/api/UiBridge";
import type { ExtractedTextNode } from "@features/text-audit/model/types";
import type { SupportedTextAuditStylePropertyName } from "@features/text-audit/model/types";
import type { TextAuditResult } from "@features/text-audit/model/types";
import { auditTextlets } from "@features/text-audit/model/audit-textlets";
import { mapTextAuditResultToPageViewModel } from "@features/text-audit/model/map-text-audit-result-to-page-view-model";
import type { TextAuditPageViewModel } from "@features/text-audit/model/page-view-model";
import { CSS_LOC_PROPERTY_NAMES } from "@shared/ui/icon-css-loc/IconCssLoc";

type State = {
	hasRequestedOnce: boolean;
	model: TextAuditPageViewModel;
	inspectorModel: TextAuditPageViewModel;
	frameGroupCount: number;
	isSelectionLocked: boolean;
	isFrameGroupMarkedSelection: boolean;
	selectedFrameGroupName: string | null;
	selectedFrameGroupNames: Array<string>;
	selectedPropertyNames: Array<SupportedTextAuditStylePropertyName>;
	lastNodes: Array<ExtractedTextNode> | null;
	lastInspectorNodes: Array<ExtractedTextNode> | null;
	lastInspectorSelectionNodeIds: Array<string>;
};

type PageMessage =
	| {
			type: "TEXT_AUDIT_NODES";
			nodes: Array<ExtractedTextNode>;
			inspectorNodes?: Array<ExtractedTextNode>;
			inspectorSelectionNodeIds?: Array<string>;
			frameGroupCount?: number;
	  }
	| {
			type: "TEXT_AUDIT_FRAME_GROUP_MARK_STATUS";
			isMarked: boolean;
			selectedFrameGroupName?: string;
			selectedFrameGroupNames?: Array<string>;
	  }
	| {
			type: "ERROR";
			message: string;
	  };

export type ViewModel = TextAuditPageViewModel;

export type Actions = {
	onRefresh: () => void;
	onSetSelectionLocked: (isLocked: boolean) => void;
	onToggleFrameGroupMarks: () => void;
	onSetPropertyEnabled: (
		propertyName: SupportedTextAuditStylePropertyName,
		isEnabled: boolean,
	) => void;
};

export type Controller = PageController & {
	getViewModel: () => ViewModel;
	getInspectorViewModel: () => ViewModel;
	getFrameGroupCount: () => number;
	getIsSelectionLocked: () => boolean;
	getIsFrameGroupMarkedSelection: () => boolean;
	getSelectedFrameGroupName: () => string | null;
	getSelectedFrameGroupNames: () => Array<string>;
	getSelectedPropertyNames: () => Array<SupportedTextAuditStylePropertyName>;
	getActions: (render: Render) => Actions;
};

const EMPTY_VIEW_MODEL: TextAuditPageViewModel = {
	status: "Idle",
	summary: null,
	textlets: [],
};

const EMPTY_INSPECTOR_VIEW_MODEL: TextAuditPageViewModel = {
	status: "Mark at least one frame group to inspect textlets.",
	summary: null,
	textlets: [],
};

function createTextAuditController(
	bridge: UiBridge,
): Controller {
	const state: State = {
		hasRequestedOnce: false,
		model: EMPTY_VIEW_MODEL,
		inspectorModel: EMPTY_INSPECTOR_VIEW_MODEL,
		frameGroupCount: 0,
		isSelectionLocked: false,
		isFrameGroupMarkedSelection: false,
		selectedFrameGroupName: null,
		selectedFrameGroupNames: [],
		selectedPropertyNames: [...CSS_LOC_PROPERTY_NAMES],
		lastNodes: null,
		lastInspectorNodes: null,
		lastInspectorSelectionNodeIds: [],
	};

	const applyAuditNodesToModel = (
		nodes: Array<ExtractedTextNode>,
		render: Render,
		options: { skipRender?: boolean } = {},
	): void => {
		state.lastNodes = nodes;

		const result = auditTextlets(nodes, {
			supportedStyleProperties: state.selectedPropertyNames,
		});

		if (nodes.length === 0) {
			state.model = {
				status: "Select one or more layers containing text.",
				summary: null,
				textlets: [],
			};
			if (options.skipRender !== true) {
				render();
			}
			return;
		}

		if (result.stats.totalInstances === 0) {
			state.model = {
				status: "No text nodes found inside frame groups in the current selection.",
				summary: null,
				textlets: [],
			};
			if (options.skipRender !== true) {
				render();
			}
			return;
		}

		state.model = mapTextAuditResultToPageViewModel(result, {
			status: `Synced ${result.stats.totalInstances} text instances into ${result.stats.totalTextlets} textlets.`,
		});
		if (options.skipRender !== true) {
			render();
		}
	};

	const applyInspectorNodesToModel = (
		nodes: Array<ExtractedTextNode>,
		selectionNodeIds: Array<string>,
		frameGroupCount: number,
	): void => {
		state.lastInspectorNodes = nodes;
		state.lastInspectorSelectionNodeIds = selectionNodeIds;
		state.frameGroupCount = frameGroupCount;

		if (frameGroupCount === 0) {
			state.inspectorModel = EMPTY_INSPECTOR_VIEW_MODEL;
			return;
		}

		if (selectionNodeIds.length === 0) {
			state.inspectorModel = {
				status: "Select a layer inside a marked frame group to inspect textlets.",
				summary: null,
				textlets: [],
			};
			return;
		}

		const result = auditTextlets(nodes, {
			supportedStyleProperties: state.selectedPropertyNames,
		});
		const selectedIds = new Set(selectionNodeIds);
		const filteredResult = filterTextAuditResultToSelectedTextlets(
			result,
			selectedIds,
		);

		if (filteredResult.textlets.length === 0) {
			state.inspectorModel = {
				status: "No textlets matched the current selection.",
				summary: null,
				textlets: [],
			};
			return;
		}

		state.inspectorModel = mapTextAuditResultToPageViewModel(filteredResult, {
			status: `Matched ${filteredResult.stats.totalTextlets} textlets from ${frameGroupCount} frame groups.`,
		});
	};

	const requestNodes = (render: Render, status: string): void => {
		state.model = {
			...state.model,
			status,
		};
		render();
		bridge.requestTextAuditNodes();
		state.hasRequestedOnce = true;
	};

	return {
		enter(render) {
			if (state.hasRequestedOnce) {
				return;
			}
			requestNodes(render, "Loading text nodes from current selection...");
		},
		handleMessage(message, render) {
			const pageMessage = message as PageMessage;

			if (pageMessage.type === "TEXT_AUDIT_NODES") {
				applyAuditNodesToModel(pageMessage.nodes, render, {
					skipRender: true,
				});
				applyInspectorNodesToModel(
					pageMessage.inspectorNodes ?? [],
					pageMessage.inspectorSelectionNodeIds ?? [],
					pageMessage.frameGroupCount ?? 0,
				);
				render();
				return;
			}

			if (pageMessage.type === "TEXT_AUDIT_FRAME_GROUP_MARK_STATUS") {
				state.isFrameGroupMarkedSelection = pageMessage.isMarked;
				state.selectedFrameGroupName =
					pageMessage.selectedFrameGroupName ?? null;
				state.selectedFrameGroupNames =
					pageMessage.selectedFrameGroupNames ?? [];
				render();
				return;
			}

			if (pageMessage.type === "ERROR") {
				state.model = {
					...state.model,
					status: pageMessage.message,
				};
				render();
			}
		},
		getViewModel() {
			return state.model;
		},
		getInspectorViewModel() {
			return state.inspectorModel;
		},
		getFrameGroupCount() {
			return state.frameGroupCount;
		},
		getIsSelectionLocked() {
			return state.isSelectionLocked;
		},
		getIsFrameGroupMarkedSelection() {
			return state.isFrameGroupMarkedSelection;
		},
		getSelectedFrameGroupName() {
			return state.selectedFrameGroupName;
		},
		getSelectedFrameGroupNames() {
			return state.selectedFrameGroupNames;
		},
		getSelectedPropertyNames() {
			return state.selectedPropertyNames;
		},
		getActions(render) {
			return {
				onRefresh() {
					requestNodes(render, "Refreshing text audit from current selection...");
				},
				onSetSelectionLocked(isLocked) {
					state.isSelectionLocked = isLocked;
					bridge.setTextAuditSelectionLock(isLocked);
					render();
				},
				onToggleFrameGroupMarks() {
					bridge.toggleTextAuditFrameGroupMarks();
				},
				onSetPropertyEnabled(propertyName, isEnabled) {
					const hasProperty = state.selectedPropertyNames.includes(propertyName);
					if (isEnabled === hasProperty) {
						return;
					}

					state.selectedPropertyNames = isEnabled
						? [...state.selectedPropertyNames, propertyName]
						: state.selectedPropertyNames.filter(
								(name) => name !== propertyName,
							);

					if (state.lastNodes !== null) {
						applyAuditNodesToModel(state.lastNodes, render, {
							skipRender: state.lastInspectorNodes !== null,
						});
						if (state.lastInspectorNodes !== null) {
							applyInspectorNodesToModel(
								state.lastInspectorNodes,
								state.lastInspectorSelectionNodeIds,
								state.frameGroupCount,
							);
							render();
						}
						return;
					}

					render();
				},
			};
		},
	};
}

export const createPageController = createTextAuditController;

function filterTextAuditResultToSelectedTextlets(
	result: TextAuditResult,
	selectedIds: Set<string>,
): TextAuditResult {
	const textlets = result.textlets.filter((textlet) =>
		textlet.instances.some((instance) => selectedIds.has(instance.id)),
	);

	return {
		...result,
		textlets,
		stats: {
			...result.stats,
			totalTextlets: textlets.length,
			totalVariants: textlets.reduce(
				(total, textlet) => total + textlet.variants.length,
				0,
			),
			totalVariantPairings: textlets.reduce(
				(total, textlet) =>
					total + Math.max(0, textlet.variants.length - 1),
				0,
			),
			totalInstances: textlets.reduce(
				(total, textlet) => total + textlet.totalInstancesCount,
				0,
			),
		},
	};
}
