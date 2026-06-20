import { PAGE_CONFIG as FRAME_TEXT_EXTRACTOR_PAGE_CONFIG } from "@pages/frame-text-extractor/ui/page.config";
import { PAGE_CONFIG as INDEX_PAGE_CONFIG } from "@pages/index/ui/page.config";
import { PAGE_CONFIG as TEST_PAGE_CONFIG } from "@pages/test-page/ui/page.config";
import { PAGE_CONFIG as TEXT_AUDIT_PAGE_CONFIG } from "@pages/text-audit/ui/page.config";

export const PAGE_CONFIGS = [
	INDEX_PAGE_CONFIG,
	TEXT_AUDIT_PAGE_CONFIG,
	FRAME_TEXT_EXTRACTOR_PAGE_CONFIG,
	TEST_PAGE_CONFIG,
] as const;
