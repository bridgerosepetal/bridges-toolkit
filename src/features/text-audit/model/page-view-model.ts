import type {
	SupportedTextAuditStylePropertyName,
} from "./types";

export type TextAuditLocItemViewModel = {
	name: SupportedTextAuditStylePropertyName;
	value: string;
	isSharedAcrossVariants: boolean;
};

export type TextAuditVariantViewModel = {
	id: string;
	properties: Array<TextAuditLocItemViewModel>;
	instancesCount: number;
	framesLabel: string;
	rootFramesLabel: string;
};

export type TextAuditTextletCardViewModel = {
	id: string;
	title: string;
	info: string;
	totalInstancesCount: number;
	uniqueVariantsCount: number;
	variants: Array<TextAuditVariantViewModel>;
};

export type TextAuditSummaryViewModel = {
	totalTextlets: number;
	totalVariants: number;
	totalVariantPairings: number;
	totalInstances: number;
	similarityThreshold: number;
};

export type TextAuditPageViewModel = {
	status: string;
	summary: TextAuditSummaryViewModel | null;
	textlets: Array<TextAuditTextletCardViewModel>;
};
