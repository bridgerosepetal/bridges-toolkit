import type {
	ResolvedTextAuditConfig,
	SupportedTextAuditStylePropertyName,
	TextAuditConfig,
} from "./types";

const SUPPORTED_TEXT_AUDIT_STYLE_PROPERTIES: Array<SupportedTextAuditStylePropertyName> =
	[
		"font-size",
		"line-height",
		"letter-spacing",
		"font-family",
		"font-weight",
		"text-align",
		"text-transform",
		"text-decoration",
	];

const DEFAULT_TEXT_AUDIT_CONFIG: ResolvedTextAuditConfig = {
	similarityThreshold: 0.9,
	supportedStyleProperties: SUPPORTED_TEXT_AUDIT_STYLE_PROPERTIES,
};

export function resolveTextAuditConfig(
	config: TextAuditConfig = {},
): ResolvedTextAuditConfig {
	return {
		similarityThreshold:
			config.similarityThreshold ??
			DEFAULT_TEXT_AUDIT_CONFIG.similarityThreshold,
		supportedStyleProperties:
			config.supportedStyleProperties ??
			DEFAULT_TEXT_AUDIT_CONFIG.supportedStyleProperties,
	};
}
