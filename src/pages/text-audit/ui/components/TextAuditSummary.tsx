import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@shared/ui/shadcn/card";
import { Separator } from "@shared/ui/shadcn/separator";
import type { TextAuditPageViewModel } from "@features/text-audit/model/page-view-model";

export type Props = {
	model: TextAuditPageViewModel;
	children?: React.ReactNode;
};

export function TextAuditSummary(props: Props): React.JSX.Element {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Text Audit</CardTitle>
				<CardDescription>{props.model.status}</CardDescription>
			</CardHeader>
			{props.model.summary === null ? (
				<CardContent className="text-muted-foreground p-2">
					No audit result yet.
				</CardContent>
			) : (
				<CardContent className="flex flex-col gap-3">
					<Separator />
					<div className="grid grid-cols-4 gap-2">
						<Stat label="Textlets" value={props.model.summary.totalTextlets} />
						<Stat label="Variants" value={props.model.summary.totalVariants} />
						<Stat
							label="Variant Pairs"
							value={props.model.summary.totalVariantPairings}
						/>
						<Stat label="Instances" value={props.model.summary.totalInstances} />
						<Stat
							label="Threshold"
							value={props.model.summary.similarityThreshold}
						/>
					</div>
					{props.children}
				</CardContent>
			)}
		</Card>
	);
}

type StatProps = {
	label: string;
	value: string | number;
};

function Stat(props: StatProps): React.JSX.Element {
	return (
		<div className="flex min-h-14 min-w-0 flex-col justify-between gap-1 rounded-md border border-border bg-muted/30 p-2">
			<span className="text-[0.625rem] leading-tight uppercase text-muted-foreground">
				{props.label}
			</span>
			<span className="block text-sm font-medium leading-none text-foreground">
				{String(props.value)}
			</span>
		</div>
	);
}
