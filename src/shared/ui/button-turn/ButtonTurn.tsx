import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export type Props = {
	variant: "left" | "right";
	text?: string;
	children?: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	ariaLabel?: string;
};

export function ButtonTurn(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("button-turn");

	return (
		<button
			className={`${className.block} ${className.modifier(`variant-${props.variant}`)}`}
			type="button"
			onClick={props.onClick}
			disabled={props.disabled}
			aria-label={props.ariaLabel}
		>
			<span className={className.element("inner")}>
				{props.children ?? props.text}
			</span>
		</button>
	);
}
