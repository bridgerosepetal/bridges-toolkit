import type { PageId } from "@shared/config/PageId";
import { PAGE_CONFIGS } from "./page-config-registry";

export type PageMeta = {
	id: PageId;
	name: string;
	isListed: boolean;
};

const PAGE_META: Array<PageMeta> = PAGE_CONFIGS.map((page) => ({
	id: page.id,
	name: page.name,
	isListed: page.isListed,
}));

export const LISTED_PAGE_META: Array<PageMeta> = PAGE_META.filter(
	(page) => page.isListed,
);
