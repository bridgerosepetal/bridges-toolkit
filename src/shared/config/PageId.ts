export const ALL_PAGE_IDS = [
	"index",
	"frame-text-extractor",
	"text-audit",
	"test-page",
] as const;

export type PageId = (typeof ALL_PAGE_IDS)[number];

export function isPageId(value: string): value is PageId {
	return ALL_PAGE_IDS.includes(value as PageId);
}
