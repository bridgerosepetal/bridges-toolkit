import type {
	ExtractedTextNodeStyle,
	ResolvedTextAuditConfig,
	SupportedTextAuditStylePropertyName,
} from "../model/types";

export function createStyleSignature(
	style: ExtractedTextNodeStyle,
	config: ResolvedTextAuditConfig,
): string {
	return config.supportedStyleProperties
		.map((propertyName) => {
			const value = readStyleValue(style, propertyName);
			return `${propertyName}:${value ?? "__missing__"}`;
		})
		.join("|");
}

export function pickSupportedStyle(
	style: ExtractedTextNodeStyle,
	config: ResolvedTextAuditConfig,
): ExtractedTextNodeStyle {
	const nextStyle: ExtractedTextNodeStyle = {};

	for (const propertyName of config.supportedStyleProperties) {
		const value = readStyleValue(style, propertyName);
		if (value !== undefined) {
			assignStyleValue(nextStyle, propertyName, value);
		}
	}

	return nextStyle;
}

function readStyleValue(
	style: ExtractedTextNodeStyle,
	propertyName: SupportedTextAuditStylePropertyName,
): number | string | undefined {
	return style[propertyName];
}

function assignStyleValue(
	style: ExtractedTextNodeStyle,
	propertyName: SupportedTextAuditStylePropertyName,
	value: number | string,
): void {
	if (propertyName === "font-size" || propertyName === "font-weight") {
		style[propertyName] = Number(value);
		return;
	}

	style[propertyName] = String(value);
}
