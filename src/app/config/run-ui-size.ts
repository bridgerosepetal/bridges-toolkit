export const RUN_UI_HEIGHT = 600;

export const RUN_UI_WIDTHS = {
	compact: 360,
	expanded: 780,
} as const;

export type RunUiSize = keyof typeof RUN_UI_WIDTHS;
