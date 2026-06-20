import { resolveTextAuditConfig } from "./constants";
import type {
	ExtractedTextNode,
	TextAuditConfig,
	TextAuditResult,
	Textlet,
} from "./types";
import { buildCandidateGroups } from "./pipeline/build-candidate-groups";
import { clusterVariantsWithinTextlets } from "./pipeline/cluster-variants";
import { refineDuplicateCandidates } from "./pipeline/refine-duplicates";

export function auditTextlets(
	nodes: Array<ExtractedTextNode>,
	config: TextAuditConfig = {},
): TextAuditResult {
	const resolvedConfig = resolveTextAuditConfig(config);
	const candidateGroups = buildCandidateGroups(nodes, resolvedConfig);
	const refinedGroups = refineDuplicateCandidates(candidateGroups);
	const textlets = clusterVariantsWithinTextlets(refinedGroups, resolvedConfig);

	return {
		config: resolvedConfig,
		textlets,
		stats: buildStats(nodes, textlets),
	};
}

function buildStats(
	nodes: Array<ExtractedTextNode>,
	textlets: Array<Textlet>,
): TextAuditResult["stats"] {
	return {
		totalInputNodes: nodes.length,
		totalTextNodes: nodes.filter((node) => node.text.trim().length > 0).length,
		totalTextlets: textlets.length,
		totalVariants: textlets.reduce(
			(total, textlet) => total + textlet.uniqueVariantsCount,
			0,
		),
		totalVariantPairings: textlets.reduce(
			(total, textlet) =>
				total + countUniquePairs(textlet.uniqueVariantsCount),
			0,
		),
		totalInstances: textlets.reduce(
			(total, textlet) => total + textlet.totalInstancesCount,
			0,
		),
	};
}

function countUniquePairs(count: number): number {
	if (count < 2) {
		return 0;
	}

	return (count * (count - 1)) / 2;
}
