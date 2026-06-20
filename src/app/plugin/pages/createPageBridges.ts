import type { PageId } from "@shared/config/PageId";
import type { CreatePageBridgeOptions, PageBridge } from "./PageBridge";
import { PAGE_BRIDGE_REGISTRY } from "./page-bridge-registry";

export function createPageBridges(
	options: CreatePageBridgeOptions,
): Record<PageId, PageBridge> {
	return Object.fromEntries(
		PAGE_BRIDGE_REGISTRY.map((entry) => [
			entry.id,
			entry.createPageBridge(options),
		]),
	) as Record<PageId, PageBridge>;
}
