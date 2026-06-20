import { PAGE_CONFIG as FRAME_TEXT_EXTRACTOR_PAGE_CONFIG } from "@pages/frame-text-extractor/ui/page.config";
import { PAGE_CONFIG as INDEX_PAGE_CONFIG } from "@pages/index/ui/page.config";
import { PAGE_CONFIG as TEST_PAGE_CONFIG } from "@pages/test-page/ui/page.config";
import { PAGE_CONFIG as TEXT_AUDIT_PAGE_CONFIG } from "@pages/text-audit/ui/page.config";
import type { PageId } from "@shared/config/PageId";
import type { CreatePageBridgeOptions, PageBridge } from "./PageBridge";
import { createPageBridge as createFrameTextExtractorPageBridge } from "./frame-text-extractor/PageBridge";
import { createPageBridge as createIndexPageBridge } from "./index/PageBridge";
import { createPageBridge as createTestPageBridge } from "./test-page/PageBridge";
import { createPageBridge as createTextAuditPageBridge } from "./text-audit/PageBridge";

export type PageBridgeRegistryEntry = {
	id: PageId;
	createPageBridge: (options: CreatePageBridgeOptions) => PageBridge;
};

export const PAGE_BRIDGE_REGISTRY: Array<PageBridgeRegistryEntry> = [
	{
		id: INDEX_PAGE_CONFIG.id,
		createPageBridge: createIndexPageBridge,
	},
	{
		id: FRAME_TEXT_EXTRACTOR_PAGE_CONFIG.id,
		createPageBridge: createFrameTextExtractorPageBridge,
	},
	{
		id: TEXT_AUDIT_PAGE_CONFIG.id,
		createPageBridge: createTextAuditPageBridge,
	},
	{
		id: TEST_PAGE_CONFIG.id,
		createPageBridge: createTestPageBridge,
	},
];
