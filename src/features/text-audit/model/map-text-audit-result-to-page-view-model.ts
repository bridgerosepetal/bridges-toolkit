import type {
	ExtractedTextNodeStyle,
	SupportedTextAuditStylePropertyName,
	TextAuditResult,
	TextletVariant,
} from "./types";
import type {
	TextAuditPageViewModel,
	TextAuditVariantViewModel,
} from "./page-view-model";

const PROPERTY_ORDER: Array<SupportedTextAuditStylePropertyName> = [
	"font-size",
	"line-height",
	"letter-spacing",
	"font-family",
	"font-weight",
	"text-align",
	"text-transform",
	"text-decoration",
];

export function mapTextAuditResultToPageViewModel(
	result: TextAuditResult,
	options: { status?: string } = {},
): TextAuditPageViewModel {
	return {
		status: options.status ?? "Text audit ready.",
		summary: {
			totalTextlets: result.stats.totalTextlets,
			totalVariants: result.stats.totalVariants,
			totalVariantPairings: result.stats.totalVariantPairings,
			totalInstances: result.stats.totalInstances,
			similarityThreshold: result.config.similarityThreshold,
		},
		textlets: result.textlets.map((textlet) => ({
			...mapTextlet(textlet),
		})),
	};
}

function mapTextlet(
	textlet: TextAuditResult["textlets"][number],
): TextAuditPageViewModel["textlets"][number] {
	const sharedValues = getSharedFormattedPropertyValues(textlet.variants);
	const canHighlightDifferences = textlet.variants.length > 1;

	return {
		id: textlet.id,
		title: textlet.labelText,
		info: `${textlet.uniqueVariantsCount} / ${textlet.totalInstancesCount}`,
		totalInstancesCount: textlet.totalInstancesCount,
		uniqueVariantsCount: textlet.uniqueVariantsCount,
		variants: textlet.variants.map((variant) =>
			mapVariant(variant, sharedValues, canHighlightDifferences),
		),
	};
}

function mapVariant(
	variant: TextletVariant,
	sharedValues: Map<SupportedTextAuditStylePropertyName, string>,
	canHighlightDifferences: boolean,
): TextAuditVariantViewModel {
	return {
		id: variant.id,
		properties: PROPERTY_ORDER.map((propertyName) => {
			const formattedValue = formatStyleValue(propertyName, variant.style);

			return {
				name: propertyName,
				value: formattedValue,
				isSharedAcrossVariants:
					canHighlightDifferences &&
					sharedValues.get(propertyName) !== formattedValue,
			};
		}),
		instancesCount: variant.instances.length,
		framesLabel: formatVariantFramesLabel(variant),
		rootFramesLabel: formatVariantRootFramesLabel(variant),
	};
}

function formatStyleValue(
	propertyName: SupportedTextAuditStylePropertyName,
	style: ExtractedTextNodeStyle,
): string {
	const value = style[propertyName];
	if (value === undefined) {
		return "-";
	}

	if (propertyName === "font-size") {
		return `${Number(value)}px`;
	}

	if (propertyName === "font-weight") {
		return String(Number(value));
	}

	return String(value);
}

function getSharedFormattedPropertyValues(
	variants: Array<TextletVariant>,
): Map<SupportedTextAuditStylePropertyName, string> {
	const shared = new Map<SupportedTextAuditStylePropertyName, string>();
	if (variants.length === 0) {
		return shared;
	}

	for (const propertyName of PROPERTY_ORDER) {
		const firstValue = formatStyleValue(propertyName, variants[0].style);
		const isShared = variants.every(
			(variant) =>
				formatStyleValue(propertyName, variant.style) === firstValue,
		);

		if (isShared) {
			shared.set(propertyName, firstValue);
		}
	}

	return shared;
}

function formatVariantFramesLabel(variant: TextletVariant): string {
	const frameCounts = new Map<string, number>();

	for (const instance of variant.instances) {
		frameCounts.set(
			instance.frameName,
			(frameCounts.get(instance.frameName) ?? 0) + 1,
		);
	}

	return Array.from(frameCounts.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([frameName, count]) => `${frameName} (${count})`)
		.join(", ");
}

function formatVariantRootFramesLabel(variant: TextletVariant): string {
	const frameCounts = new Map<string, number>();

	for (const instance of variant.instances) {
		const rootFrameName =
			instance.context?.rootFrameName?.trim() || instance.frameName;
		frameCounts.set(
			rootFrameName,
			(frameCounts.get(rootFrameName) ?? 0) + 1,
		);
	}

	return Array.from(frameCounts.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([frameName, count]) => `${frameName} (${count})`)
		.join(", ");
}
