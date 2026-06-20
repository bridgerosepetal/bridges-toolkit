import React from "react";
import Logo from "../../../shared/assets/bridges-toolkit-logo.png";

export function IndexPage(): React.JSX.Element {
	return (
		<main className="p-2">
			{/* <p>
				Welcome to Bridge's Toolkit -- a Figma plugin that will never be allowed on the marketplace.
			</p> */}
			<div className="flex justify-center items-center">
				<img src={Logo} />
			</div>
		</main>
	);
}
