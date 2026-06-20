import { createStyleSignature, pickSupportedStyle } from "../../lib/style-signature";
import type {
	RefinedCandidateGroup,
	ResolvedTextAuditConfig,
	Textlet,
	TextletInstance,
	TextletVariant,
} from "../types";

export function clusterVariantsWithinTextlets(
	groups: Array<RefinedCandidateGroup>,
	config: ResolvedTextAuditConfig,
): Array<Textlet> {
	return groups
		.map((group, groupIndex) => {
			const variantMap = new Map<string, TextletVariant>();
			const instances: Array<TextletInstance> = [];

			for (const member of group.members) {
				const instance = toTextletInstance(member);
				instances.push(instance);

				const styleSignature = createStyleSignature(member.node.style, config);
				const existingVariant = variantMap.get(styleSignature);

				if (existingVariant !== undefined) {
					existingVariant.instances.push(instance);
					continue;
				}

				variantMap.set(styleSignature, {
					id: `textlet-${groupIndex + 1}-variant-${variantMap.size + 1}`,
					styleSignature,
					style: pickSupportedStyle(member.node.style, config),
					instances: [instance],
				});
			}

			const variants = Array.from(variantMap.values()).sort(
				compareVariantsByUsage,
			);
			const labelText = pickLabelText(instances);

			return {
				id: `textlet-${groupIndex + 1}`,
				labelText,
				normalizedText: group.representativeNormalizedText,
				variants,
				instances: [...instances].sort(compareInstancesForUi),
				uniqueVariantsCount: variants.length,
				totalInstancesCount: instances.length,
			};
		})
		.sort(compareTextletsForUi);
}

function toTextletInstance(
	member: RefinedCandidateGroup["members"][number],
): TextletInstance {
	return {
		id: member.node.id,
		frameId: member.node.frameId,
		frameName: member.node.frameName,
		text: member.node.text,
		x: member.node.x,
		y: member.node.y,
		width: member.node.width,
		height: member.node.height,
		frameWidth: member.node.frameWidth,
		frameHeight: member.node.frameHeight,
		style: member.node.style,
		layoutFingerprint: member.layoutFingerprint,
		duplicateRankInFrame: member.duplicateRankInFrame,
		context: member.node.context,
	};
}

function pickLabelText(instances: Array<TextletInstance>): string {
	const counts = new Map<string, number>();

	for (const instance of instances) {
		counts.set(instance.text, (counts.get(instance.text) ?? 0) + 1);
	}

	let bestText = instances[0]?.text ?? "";
	let bestCount = 0;

	for (const [text, count] of Array.from(counts.entries())) {
		if (
			count > bestCount ||
			(count === bestCount && text.length < bestText.length)
		) {
			bestText = text;
			bestCount = count;
		}
	}

	return bestText;
}

function compareVariantsByUsage(a: TextletVariant, b: TextletVariant): number {
	return (
		b.instances.length - a.instances.length ||
		a.styleSignature.localeCompare(b.styleSignature)
	);
}

function compareInstancesForUi(a: TextletInstance, b: TextletInstance): number {
	return (
		a.frameName.localeCompare(b.frameName) ||
		a.y - b.y ||
		a.x - b.x ||
		a.duplicateRankInFrame - b.duplicateRankInFrame ||
		a.id.localeCompare(b.id)
	);
}

function compareTextletsForUi(a: Textlet, b: Textlet): number {
	return (
		a.labelText.localeCompare(b.labelText) ||
		b.totalInstancesCount - a.totalInstancesCount ||
		a.id.localeCompare(b.id)
	);
}
