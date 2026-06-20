import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export type Props = {
	children?: React.ReactNode;
};

export function Header(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("header");

	return (
		<header className={className.block}>
			<div className={className.element("inner")}>{props.children}</div>
		</header>
	);
}
