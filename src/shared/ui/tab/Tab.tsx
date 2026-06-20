import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export type Props = {
	text?: string;
	isSelected?: boolean;
	children?: React.ReactNode;
	onClick?: () => void;
};

export function Tab(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("tab");
	const tabIndex = props.isSelected ? 0 : -1;

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
		if (event.key !== "Enter" && event.key !== " ") {
			return;
		}

		event.preventDefault();
		props.onClick?.();
	};

	return (
		<div
			className={className.block}
			role="tab"
			aria-selected={props.isSelected}
			tabIndex={tabIndex}
			onClick={props.onClick}
			onKeyDown={handleKeyDown}
		>
			<div className={className.element("inner")}>
				{props.children ?? props.text}
			</div>
		</div>
	);
}
