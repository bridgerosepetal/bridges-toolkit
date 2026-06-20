import { createEmptyPageBridge, type PageBridge } from "../PageBridge";

function createIndexPageBridge(): PageBridge {
	return createEmptyPageBridge();
}

export const createPageBridge = createIndexPageBridge;
