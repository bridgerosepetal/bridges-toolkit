import React from "react";
import type { TextAuditTextletCardViewModel } from "@features/text-audit/model/page-view-model";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@shared/ui/shadcn/card";
import { CssProp } from "@shared/ui/css-prop/CssProp";
import type { CssLocPropertyName } from "@shared/ui/icon-css-loc/IconCssLoc";

export type Props = {
	card: TextAuditTextletCardViewModel;
	selectedPropertyNames: Set<CssLocPropertyName>;
};

export function TextletCard(props: Props): React.JSX.Element {
	return (
		<Card className="gap-2 overflow-visible bg-transparent py-0 ring-0">
			<CardHeader className="flex flex-row items-start justify-between gap-3 px-0">
				<CardTitle className="font-heading">{props.card.title}</CardTitle>
				<span className="shrink-0 text-xs/relaxed text-muted-foreground">
					{props.card.info}
				</span>
			</CardHeader>
			<CardContent className="px-0">
				<div className="flex flex-wrap items-start gap-1">
					{props.card.variants.map((variant) => (
						<div
							key={variant.id}
							className="flex flex-col gap-1 rounded-md border border-border p-2"
						>
							{variant.properties
								.filter((property) =>
									props.selectedPropertyNames.has(property.name),
								)
								.map((property) => (
									<CssProp
										key={`${variant.id}-${property.name}`}
										name={property.name}
										text={property.value}
										isUnderlined={property.isSharedAcrossVariants}
									/>
								))}
							<p className="mt-1 flex w-full flex-col gap-0.5 border-t border-border pt-1">
								<span className="text-[0.625rem] text-muted-foreground">
									{variant.instancesCount} instance
									{variant.instancesCount === 1 ? "" : "s"}
								</span>
								<span className="max-w-40 truncate text-[0.625rem] text-muted-foreground">
									{variant.framesLabel}
								</span>
								<span className="max-w-40 truncate text-[0.625rem] text-muted-foreground">
									{variant.rootFramesLabel}
								</span>
							</p>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
