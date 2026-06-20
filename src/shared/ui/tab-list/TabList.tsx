import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export type Props = {
	children?: React.ReactNode;
	innerRef?: React.RefObject<HTMLDivElement>;
	onInnerScroll?: () => void;
};

export function TabList(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("tab-list");

	return (
		<ul className={className.block}>
			<div
				className={className.element("inner")}
				ref={props.innerRef}
				onScroll={props.onInnerScroll}
			>
				{props.children}
			</div>
		</ul>
	);
}
