import { createEmptyPageBridge, type PageBridge } from "../PageBridge";

function createTestPageBridge(): PageBridge {
	return createEmptyPageBridge();
}

export const createPageBridge = createTestPageBridge;
