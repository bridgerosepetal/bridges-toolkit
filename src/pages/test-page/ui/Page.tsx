import React from "react";
import { Button } from "@shared/ui/shadcn/button";

export type Props = {
	onBack: () => void;
	onClose: () => void;
};

export function TestPage(props: Props): React.JSX.Element {
	return (
		<main className="selection-panel">
			<h1 className="selection-panel--title">Test Page</h1>
			<p className="selection-panel--status">
				This is a second page to validate navigation structure.
			</p>

			<section className="selection-panel--summary">
				<div className="selection-panel--summary-row">
					<span className="selection-panel--summary-label">Page key</span>
					<span className="selection-panel--summary-value">test-page</span>
				</div>
			</section>

			<div className="selection-panel--actions">
				<Button type="button" variant="secondary" onClick={props.onBack}>
					Back
				</Button>
				<Button type="button" variant="ghost" onClick={props.onClose}>
					Close
				</Button>
			</div>
		</main>
	);
}
