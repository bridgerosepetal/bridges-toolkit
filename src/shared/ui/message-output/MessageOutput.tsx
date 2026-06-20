import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export type Props = {
	text: string;
};

export function MessageOutput(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("message-output");

	return (
		<div className={className.block}>
			<div className={className.element("text")}>{props.text}</div>
		</div>
	);
}
