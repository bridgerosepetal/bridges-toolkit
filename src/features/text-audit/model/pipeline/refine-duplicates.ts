import type {
	CandidateGroup,
	RefinedCandidateGroup,
	RefinedCandidateMember,
} from "../types";

export function refineDuplicateCandidates(
	groups: Array<CandidateGroup>,
): Array<RefinedCandidateGroup> {
	return groups.map((group) => {
		const members = [...group.members].sort(compareMembersForDuplicateRanking);
		const duplicateCounters = new Map<string, number>();

		const refinedMembers: Array<RefinedCandidateMember> = members.map(
			(member) => {
				const duplicateKey = `${member.node.frameId}|${member.layoutFingerprint}`;
				const nextRank = duplicateCounters.get(duplicateKey) ?? 0;
				duplicateCounters.set(duplicateKey, nextRank + 1);

				return {
					...member,
					duplicateRankInFrame: nextRank,
				};
			},
		);

		return {
			id: group.id,
			representativeNormalizedText: group.representativeNormalizedText,
			members: refinedMembers,
		};
	});
}

function compareMembersForDuplicateRanking(
	a: CandidateGroup["members"][number],
	b: CandidateGroup["members"][number],
): number {
	return (
		a.node.frameId.localeCompare(b.node.frameId) ||
		a.layoutFingerprint.localeCompare(b.layoutFingerprint) ||
		a.node.y - b.node.y ||
		a.node.x - b.node.x ||
		a.node.id.localeCompare(b.node.id)
	);
}
