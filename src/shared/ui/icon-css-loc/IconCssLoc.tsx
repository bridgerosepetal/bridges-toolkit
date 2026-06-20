import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

const CSS_LOC_PROPERTY_META = {
	"font-size": {
		short: "fs",
		ariaLabel: "font size",
	},
	"letter-spacing": {
		short: "ls",
		ariaLabel: "letter spacing",
	},
	"font-family": {
		short: "ff",
		ariaLabel: "font family",
	},
	"font-weight": {
		short: "fw",
		ariaLabel: "font weight",
	},
	"line-height": {
		short: "lh",
		ariaLabel: "line height",
	},
	"text-align": {
		short: "ta",
		ariaLabel: "text align",
	},
	"text-transform": {
		short: "tt",
		ariaLabel: "text transform",
	},
	"text-decoration": {
		short: "td",
		ariaLabel: "text decoration",
	},
} as const;

export type CssLocPropertyName = keyof typeof CSS_LOC_PROPERTY_META;
export const CSS_LOC_PROPERTY_NAMES = Object.keys(
	CSS_LOC_PROPERTY_META,
) as Array<CssLocPropertyName>;

export type Props = {
	name: CssLocPropertyName;
};

export function IconCssLoc(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("icon-css-loc");
	const meta = CSS_LOC_PROPERTY_META[props.name];

	return (
		<span
			className={className.block}
			role="img"
			aria-label={meta.ariaLabel}
		>
			<span className={className.element("inner")}>{meta.short}</span>
		</span>
	);
}
