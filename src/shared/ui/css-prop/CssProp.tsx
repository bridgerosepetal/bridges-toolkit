import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";
import { IconCssLoc, type CssLocPropertyName } from "../icon-css-loc/IconCssLoc";

export type Props = {
	name: CssLocPropertyName;
	text: string;
	isUnderlined?: boolean;
};

export function CssProp(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("css-prop");
	const rootClassName = props.isUnderlined
		? `${className.block} ${className.modifier("underlined")}`
		: className.block;

	return (
		<div className={rootClassName}>
			<div className={className.element("inner")}>
				<IconCssLoc name={props.name} />
				<span className={className.element("text")}>{props.text}</span>
			</div>
		</div>
	);
}

