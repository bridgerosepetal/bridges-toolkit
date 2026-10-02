import type { FrameTextSnapshot } from "@features/selection-inspector/model/get-frame-text-snapshot";
import type { ExtractedTextNode } from "@features/text-audit/model/types";
import { isPageId, type PageId } from "@shared/config/PageId";

export type UiToMainMessage =
	| {
			type: "SET_ACTIVE_PAGE";
			page: PageId;
	  }
	| {
			type: "RESIZE_PLUGIN_UI";
			width: number;
			height: number;
	  }
	| {
			type: "REQUEST_FRAME_TEXT_SNAPSHOT";
	  }
	| {
			type: "REQUEST_TEXT_AUDIT_NODES";
	  }
	| {
			type: "SET_TEXT_AUDIT_SELECTION_LOCK";
			isLocked: boolean;
	  }
	| {
			type: "TOGGLE_TEXT_AUDIT_FRAME_GROUP_MARKS";
	  }
	| {
			type: "CLOSE_PLUGIN";
	  };

export type MainToUiMessage =
	| {
			type: "FRAME_TEXT_SNAPSHOT";
			snapshot: FrameTextSnapshot;
	  }
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

export function isUiToMainMessage(value: unknown): value is UiToMainMessage {
	if (typeof value !== "object" || value === null || !("type" in value)) {
		return false;
	}

	const message = value as Record<string, unknown>;
	switch (message.type) {
		case "SET_ACTIVE_PAGE":
			return typeof message.page === "string" && isPageId(message.page);
		case "RESIZE_PLUGIN_UI":
			return (
				isPositiveSize(message.width) && isPositiveSize(message.height)
			);
		case "SET_TEXT_AUDIT_SELECTION_LOCK":
			return typeof message.isLocked === "boolean";
		case "REQUEST_FRAME_TEXT_SNAPSHOT":
		case "REQUEST_TEXT_AUDIT_NODES":
		case "TOGGLE_TEXT_AUDIT_FRAME_GROUP_MARKS":
		case "CLOSE_PLUGIN":
			return true;
		default:
			return false;
	}
}

function isPositiveSize(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}
