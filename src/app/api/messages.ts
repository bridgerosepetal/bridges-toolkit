import type { FrameTextSnapshot } from "@features/selection-inspector/model/get-frame-text-snapshot";
import type { SelectionSnapshot } from "@features/selection-inspector/model/get-selection-snapshot";
import type { ExtractedTextNode } from "@features/text-audit/model/types";
import type { PageId } from "@shared/config/PageId";

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
			type: "REQUEST_SELECTION_SNAPSHOT";
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
			type: "SELECTION_SNAPSHOT";
			snapshot: SelectionSnapshot;
	  }
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

	const { type } = value as { type: unknown };
	return (
		type === "SET_ACTIVE_PAGE" ||
		type === "RESIZE_PLUGIN_UI" ||
		type === "REQUEST_SELECTION_SNAPSHOT" ||
		type === "REQUEST_FRAME_TEXT_SNAPSHOT" ||
		type === "REQUEST_TEXT_AUDIT_NODES" ||
		type === "SET_TEXT_AUDIT_SELECTION_LOCK" ||
		type === "TOGGLE_TEXT_AUDIT_FRAME_GROUP_MARKS" ||
		type === "CLOSE_PLUGIN"
	);
}
