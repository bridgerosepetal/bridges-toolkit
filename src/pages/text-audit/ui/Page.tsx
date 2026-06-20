import React, { useMemo, useState } from "react";
import { Blocks, Lock, LockOpen } from "lucide-react";
import { Button } from "@shared/ui/shadcn/button";
import {
	EmptyState,
	EmptyStateDescription,
	EmptyStateHeader,
	EmptyStateTitle,
} from "@shared/ui/shadcn/empty-state";
import { Input } from "@shared/ui/shadcn/input";
import { Separator } from "@shared/ui/shadcn/separator";
import { Switch } from "@shared/ui/shadcn/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@shared/ui/shadcn/tabs";
import {
	CSS_LOC_PROPERTY_NAMES,
	type CssLocPropertyName,
} from "@shared/ui/icon-css-loc/IconCssLoc";
import type { RunUiSize } from "@app/config/run-ui-size";
import type { TextAuditPageViewModel } from "@features/text-audit/model/page-view-model";
import { TextAuditSummary } from "./components/TextAuditSummary";
import { TextletCard } from "./components/TextletCard";
import { VariantPairsAccordion } from "./components/VariantPairsAccordion";

export type Props = {
	model: TextAuditPageViewModel;
	inspectorModel: TextAuditPageViewModel;
	frameGroupCount: number;
	windowSize: RunUiSize;
	isSelectionLocked: boolean;
	isFrameGroupMarkedSelection: boolean;
	selectedFrameGroupName: string | null;
	selectedFrameGroupNames: Array<string>;
	selectedPropertyNames: Array<CssLocPropertyName>;
	onRefresh: () => void;
	onSetSelectionLocked: (isLocked: boolean) => void;
	onToggleFrameGroupMarks: () => void;
	onSetPropertyEnabled: (
		propertyName: CssLocPropertyName,
		isEnabled: boolean,
	) => void;
};

export function TextAuditPage(props: Props): React.JSX.Element {
	const [searchQuery, setSearchQuery] = useState("");
	const [inspectorSearchQuery, setInspectorSearchQuery] = useState("");
	const normalizedQuery = searchQuery.trim().toLowerCase();
	const normalizedInspectorQuery = inspectorSearchQuery.trim().toLowerCase();
	const emptyState = getTextletsEmptyState({
		status: props.model.status,
		hasTextlets: props.model.textlets.length > 0,
		hasSearchQuery: normalizedQuery.length > 0,
	});
	const inspectorEmptyState = getInspectorEmptyState({
		status: props.inspectorModel.status,
		hasTextlets: props.inspectorModel.textlets.length > 0,
		hasSearchQuery: normalizedInspectorQuery.length > 0,
		frameGroupCount: props.frameGroupCount,
	});
	const selectedPropertyNamesSet = useMemo(
		() => new Set(props.selectedPropertyNames),
		[props.selectedPropertyNames],
	);

	const controlsDataText = [
		`frame groups: ${
			props.selectedFrameGroupNames.length === 0
				? "-"
				: props.selectedFrameGroupNames.join(", ")
		}.`,
	].join(" ");

	return (
		<main className="flex flex-col gap-3 p-4 text-foreground">
			<Tabs defaultValue="textlets">
				<TabsList>
					<TabsTrigger value="textlets">Textlets</TabsTrigger>
					<TabsTrigger value="inspector">Inspector</TabsTrigger>
					<TabsTrigger value="misc">Misc</TabsTrigger>
				</TabsList>
				<TabsContent
					value="textlets"
					className="flex flex-col gap-3"
				>
					<TextletBrowser
						model={props.model}
						searchQuery={searchQuery}
						emptyState={emptyState}
						selectedPropertyNames={selectedPropertyNamesSet}
						windowSize={props.windowSize}
						onSearchQueryChange={setSearchQuery}
						onSetPropertyEnabled={props.onSetPropertyEnabled}
					/>
				</TabsContent>
				<TabsContent
					value="inspector"
					className="flex flex-col gap-3"
				>
					<TextletBrowser
						model={props.inspectorModel}
						searchQuery={inspectorSearchQuery}
						emptyState={inspectorEmptyState}
						selectedPropertyNames={selectedPropertyNamesSet}
						windowSize={props.windowSize}
						onSearchQueryChange={setInspectorSearchQuery}
						onSetPropertyEnabled={props.onSetPropertyEnabled}
					/>
				</TabsContent>
				<TabsContent
					value="misc"
					className="flex flex-col gap-3"
				>
					<TextAuditSummary model={props.model} />
					<div className="flex flex-col gap-1.5">
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								role="switch"
								aria-checked={props.isFrameGroupMarkedSelection}
								aria-label="Toggle frame group mark on selected frame(s)"
								className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								title="Toggle frame group mark on selected frame(s)"
								onClick={props.onToggleFrameGroupMarks}
							>
								<Blocks size={14} />
								<Switch
									checked={props.isFrameGroupMarkedSelection}
									aria-hidden="true"
								/>
							</button>
							<button
								type="button"
								role="switch"
								aria-checked={props.isSelectionLocked}
								aria-label={
									props.isSelectionLocked
										? "Unlock selection updates"
										: "Lock selection updates"
								}
								className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
								title={
									props.isSelectionLocked
										? "Unlock selection updates"
										: "Lock selection updates"
								}
								onClick={() => {
									props.onSetSelectionLocked(!props.isSelectionLocked);
								}}
							>
								{props.isSelectionLocked ? (
									<Lock size={14} />
								) : (
									<LockOpen size={14} />
								)}
								<Switch
									checked={props.isSelectionLocked}
									aria-hidden="true"
								/>
							</button>
						</div>
						<span className="text-xs/relaxed text-muted-foreground">
							{controlsDataText}
						</span>
					</div>
					<VariantPairsAccordion
						textlets={props.model.textlets}
						selectedPropertyNames={selectedPropertyNamesSet}
					/>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={props.onRefresh}
						>
							Refresh text audit
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</main>
	);
}

type TextletBrowserProps = {
	model: TextAuditPageViewModel;
	searchQuery: string;
	emptyState: TextletsEmptyState;
	selectedPropertyNames: Set<CssLocPropertyName>;
	windowSize: RunUiSize;
	onSearchQueryChange: (query: string) => void;
	onSetPropertyEnabled: (
		propertyName: CssLocPropertyName,
		isEnabled: boolean,
	) => void;
};

function TextletBrowser(props: TextletBrowserProps): React.JSX.Element {
	const normalizedQuery = props.searchQuery.trim().toLowerCase();
	const filteredTextlets = useMemo(() => {
		if (normalizedQuery.length === 0) {
			return props.model.textlets;
		}

		return props.model.textlets.filter((textlet) =>
			textlet.title.toLowerCase().includes(normalizedQuery),
		);
	}, [normalizedQuery, props.model.textlets]);
	const isExpanded = props.windowSize === "expanded";

	if (props.model.textlets.length === 0) {
		return <TextletEmptyState emptyState={props.emptyState} />;
	}

	return (
		<div
			className={
				isExpanded
					? "grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4"
					: "flex flex-col gap-3"
			}
		>
			<div className="flex min-w-0 flex-col gap-3">
				<Input
					value={props.searchQuery}
					placeholder="Filter textlets by text..."
					onChange={(event) => {
						props.onSearchQueryChange(event.currentTarget.value);
					}}
				/>
				<div className="flex flex-wrap gap-1.5">
					{CSS_LOC_PROPERTY_NAMES.map((propertyName) => (
						<button
							key={propertyName}
							type="button"
							role="switch"
							aria-checked={props.selectedPropertyNames.has(propertyName)}
							aria-label={`Toggle ${propertyName}`}
							className="inline-flex h-6 items-center gap-1.5 rounded-md border border-input bg-transparent px-2 text-[0.625rem] font-medium text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
							title={propertyName}
							onClick={() => {
								props.onSetPropertyEnabled(
									propertyName,
									!props.selectedPropertyNames.has(propertyName),
								);
							}}
						>
							<Switch
								checked={props.selectedPropertyNames.has(propertyName)}
								aria-hidden="true"
							/>
							<span>{propertyName}</span>
						</button>
					))}
				</div>
			</div>
			<div className="min-w-0">
				{filteredTextlets.length === 0 ? (
					<TextletEmptyState emptyState={props.emptyState} />
				) : (
					<section className="flex flex-col gap-3">
						{filteredTextlets.map((card, index) => (
							<React.Fragment key={card.id}>
								{index === 0 ? null : <Separator />}
								<TextletCard
									card={card}
									selectedPropertyNames={props.selectedPropertyNames}
								/>
							</React.Fragment>
						))}
					</section>
				)}
			</div>
		</div>
	);
}

function TextletEmptyState(props: {
	emptyState: TextletsEmptyState;
}): React.JSX.Element {
	return (
		<EmptyState>
			<EmptyStateHeader>
				<EmptyStateTitle>{props.emptyState.title}</EmptyStateTitle>
				<EmptyStateDescription>
					{props.emptyState.description}
				</EmptyStateDescription>
			</EmptyStateHeader>
		</EmptyState>
	);
}

type TextletsEmptyStateInput = {
	status: string;
	hasTextlets: boolean;
	hasSearchQuery: boolean;
};

type TextletsEmptyState = {
	title: string;
	description: string;
};

function getTextletsEmptyState(
	input: TextletsEmptyStateInput,
): TextletsEmptyState {
	if (input.hasSearchQuery && input.hasTextlets) {
		return {
			title: "No matching textlets",
			description: "Nothing matched the current search.",
		};
	}

	if (input.status === "Select one or more layers containing text.") {
		return {
			title: "Nothing selected",
			description: "Select one or more layers containing text to audit textlets.",
		};
	}

	return {
		title: "No textlets",
		description: "No textlets were found in the current selection.",
	};
}

type InspectorEmptyStateInput = TextletsEmptyStateInput & {
	frameGroupCount: number;
};

function getInspectorEmptyState(
	input: InspectorEmptyStateInput,
): TextletsEmptyState {
	if (input.hasSearchQuery && input.hasTextlets) {
		return {
			title: "No matching textlets",
			description: "Nothing matched the current search.",
		};
	}

	if (input.frameGroupCount === 0) {
		return {
			title: "No frame groups",
			description:
				"Mark at least one frame group before using the inspector.",
		};
	}

	if (input.status === "Select a layer inside a marked frame group to inspect textlets.") {
		return {
			title: "Nothing selected",
			description:
				"Select a frame group, frame, or text layer inside a marked frame group.",
		};
	}

	return {
		title: "No inspected textlets",
		description:
			"No frame-group textlets matched the current selection.",
	};
}
