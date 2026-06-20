import { normalizeText } from "../../lib/normalize-text";
import { calculateStringSimilarity } from "../../lib/string-similarity";
import { createLayoutFingerprint } from "../../lib/layout-fingerprint";
import type {
	CandidateGroup,
	CandidateMember,
	ExtractedTextNode,
	ResolvedTextAuditConfig,
} from "../types";

export function buildCandidateGroups(
	nodes: Array<ExtractedTextNode>,
	config: ResolvedTextAuditConfig,
): Array<CandidateGroup> {
	const members = nodes
		.map(toCandidateMember)
		.filter((member): member is CandidateMember => member !== null)
		.sort(compareCandidateMembers);

	const groups: Array<CandidateGroup> = [];

	for (const member of members) {
		const bestGroup = findBestGroup(
			groups,
			member,
			config,
		);

		if (bestGroup === undefined) {
			groups.push({
				id: `candidate-group-${groups.length + 1}`,
				representativeNormalizedText: member.normalizedText,
				frameGroupId: member.frameGroupId,
				frameGroupCenterXRatio: member.frameGroupCenterXRatio,
				frameGroupCenterYRatio: member.frameGroupCenterYRatio,
				frameGroupTreeDepth: member.frameGroupTreeDepth,
				members: [member],
			});
			continue;
		}

		bestGroup.members.push(member);
		updateFrameGroupTreeDepthCentroid(bestGroup, member);
	}

	return groups;
}

function toCandidateMember(node: ExtractedTextNode): CandidateMember | null {
	const normalizedText = normalizeText(node.text);
	if (normalizedText.length === 0) {
		return null;
	}
	const frameGroupId = node.context?.frameGroupId;
	if (frameGroupId === undefined || frameGroupId.length === 0) {
		return null;
	}

	return {
		node,
		normalizedText,
		layoutFingerprint: createLayoutFingerprint(node),
		frameGroupId,
		frameGroupCenterXRatio: node.context?.frameGroupCenterXRatio,
		frameGroupCenterYRatio: node.context?.frameGroupCenterYRatio,
		frameGroupTreeDepth: node.context?.frameGroupTreeDepth,
	};
}

function compareCandidateMembers(a: CandidateMember, b: CandidateMember): number {
	return (
		a.normalizedText.localeCompare(b.normalizedText) ||
		a.node.frameId.localeCompare(b.node.frameId) ||
		a.node.y - b.node.y ||
		a.node.x - b.node.x
	);
}

function findBestGroup(
	groups: Array<CandidateGroup>,
	member: CandidateMember,
	config: ResolvedTextAuditConfig,
): CandidateGroup | undefined {
	let bestGroup: CandidateGroup | undefined;
	let bestScore = 0;
	let bestFrameGroupDistance = Infinity;

	for (const group of groups) {
		if (group.frameGroupId !== member.frameGroupId) {
			continue;
		}

		const frameGroupDistance = getFrameGroupTreeDepthDistance(group, member);
		const score = calculateStringSimilarity(
			member.normalizedText,
			group.representativeNormalizedText,
		);
		if (score < config.similarityThreshold) {
			continue;
		}

		if (score < bestScore) {
			continue;
		}

		if (score === bestScore && frameGroupDistance >= bestFrameGroupDistance) {
			continue;
		}

		bestScore = score;
		bestFrameGroupDistance = frameGroupDistance;
		bestGroup = group;
	}

	return bestGroup;
}

function getFrameGroupTreeDepthDistance(
	group: CandidateGroup,
	member: CandidateMember,
): number {
	if (
		group.frameGroupTreeDepth === undefined ||
		member.frameGroupTreeDepth === undefined
	) {
		return Infinity;
	}

	return Math.abs(group.frameGroupTreeDepth - member.frameGroupTreeDepth);
}

function updateFrameGroupTreeDepthCentroid(
	group: CandidateGroup,
	member: CandidateMember,
): void {
	if (
		group.frameGroupTreeDepth === undefined ||
		member.frameGroupTreeDepth === undefined
	) {
		return;
	}

	const count = group.members.length;
	const previousCount = count - 1;

	group.frameGroupTreeDepth =
		(group.frameGroupTreeDepth * previousCount + member.frameGroupTreeDepth) /
		count;
}
