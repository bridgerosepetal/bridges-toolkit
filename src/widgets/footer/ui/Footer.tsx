import React from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export function Footer(): React.JSX.Element {
	const className = createClassNameBuilder("footer");

	return (
		<div className={className.block}>
			<div className={className.element("inner")}>@bridgerosepetal</div>
		</div>
	);
}
