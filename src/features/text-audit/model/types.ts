export type SupportedTextAuditStylePropertyName =
	| "font-size"
	| "letter-spacing"
	| "font-family"
	| "font-weight"
	| "line-height"
	| "text-align"
	| "text-transform"
	| "text-decoration";

export type ExtractedTextNodeStyle = {
	"font-size"?: number;
	"letter-spacing"?: string;
	"font-family"?: string;
	"font-weight"?: number;
	"line-height"?: string;
	"text-align"?: string;
	"text-transform"?: string;
	"text-decoration"?: string;
};

export type ExtractedTextNode = {
	id: string;
	frameId: string;
	frameName: string;
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	frameWidth: number;
	frameHeight: number;
	style: ExtractedTextNodeStyle;
	context?: {
		parentPath?: Array<string>;
		rootFrameName?: string;
		frameGroupId?: string;
		frameGroupName?: string;
		frameGroupCenterXRatio?: number;
		frameGroupCenterYRatio?: number;
		frameGroupTreeDepth?: number;
		componentId?: string;
	};
};

export type TextAuditConfig = {
	similarityThreshold?: number;
	supportedStyleProperties?: Array<SupportedTextAuditStylePropertyName>;
};

export type ResolvedTextAuditConfig = {
	similarityThreshold: number;
	supportedStyleProperties: Array<SupportedTextAuditStylePropertyName>;
};

export type CandidateMember = {
	node: ExtractedTextNode;
	normalizedText: string;
	layoutFingerprint: string;
	frameGroupId: string;
	frameGroupCenterXRatio?: number;
	frameGroupCenterYRatio?: number;
	frameGroupTreeDepth?: number;
};

export type CandidateGroup = {
	id: string;
	representativeNormalizedText: string;
	frameGroupId: string;
	frameGroupCenterXRatio?: number;
	frameGroupCenterYRatio?: number;
	frameGroupTreeDepth?: number;
	members: Array<CandidateMember>;
};

export type RefinedCandidateMember = CandidateMember & {
	duplicateRankInFrame: number;
};

export type RefinedCandidateGroup = {
	id: string;
	representativeNormalizedText: string;
	members: Array<RefinedCandidateMember>;
};

export type TextletInstance = {
	id: string;
	frameId: string;
	frameName: string;
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
	frameWidth: number;
	frameHeight: number;
	style: ExtractedTextNodeStyle;
	layoutFingerprint: string;
	duplicateRankInFrame: number;
	context?: ExtractedTextNode["context"];
};

export type TextletVariant = {
	id: string;
	styleSignature: string;
	style: ExtractedTextNodeStyle;
	instances: Array<TextletInstance>;
};

export type Textlet = {
	id: string;
	labelText: string;
	normalizedText: string;
	variants: Array<TextletVariant>;
	instances: Array<TextletInstance>;
	uniqueVariantsCount: number;
	totalInstancesCount: number;
};

export type TextAuditStats = {
	totalInputNodes: number;
	totalTextNodes: number;
	totalTextlets: number;
	totalVariants: number;
	totalVariantPairings: number;
	totalInstances: number;
};

export type TextAuditResult = {
	config: ResolvedTextAuditConfig;
	textlets: Array<Textlet>;
	stats: TextAuditStats;
};
