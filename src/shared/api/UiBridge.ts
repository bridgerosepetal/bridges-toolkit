import type { PageId } from "../config/PageId";

export type UiBridge = {
	setActivePage: (page: PageId) => void;
	requestSelectionSnapshot: () => void;
	requestFrameTextSnapshot: () => void;
	requestTextAuditNodes: () => void;
	setTextAuditSelectionLock: (isLocked: boolean) => void;
	toggleTextAuditFrameGroupMarks: () => void;
	resizePluginUi: (width: number, height: number) => void;
	closePlugin: () => void;
	onMessage: (handler: (message: unknown) => void) => void;
};
