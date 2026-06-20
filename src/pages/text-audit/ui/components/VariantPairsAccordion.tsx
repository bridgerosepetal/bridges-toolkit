import React, { useMemo } from "react";
import type {
	TextAuditTextletCardViewModel,
	TextAuditVariantViewModel,
} from "@features/text-audit/model/page-view-model";
import { Button } from "@shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@shared/ui/shadcn/card";
import { CssProp } from "@shared/ui/css-prop/CssProp";
import type { CssLocPropertyName } from "@shared/ui/icon-css-loc/IconCssLoc";

export type Props = {
	textlets: Array<TextAuditTextletCardViewModel>;
	selectedPropertyNames: Set<CssLocPropertyName>;
};

type VariantPairViewModel = {
	id: string;
	name: string;
	occurrences: number;
	variants: Array<TextAuditVariantViewModel>;
	uniqueTexts: Array<string>;
};

export function VariantPairsAccordion(props: Props): React.JSX.Element {
	const pairs = useMemo(
		() =>
			buildUniqueVariantPairs(
				props.textlets,
				props.selectedPropertyNames,
			),
		[props.selectedPropertyNames, props.textlets],
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between gap-2">
					<span>Variant Pairs</span>
					<span className="text-muted-foreground">{pairs.length}</span>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{pairs.length === 0 ? (
					<p className="text-xs/relaxed text-muted-foreground">
						No variant pairs available yet.
					</p>
				) : (
					<div className="flex flex-col gap-2">
						{pairs.map((pair) => (
							<VariantPairCard
								key={pair.id}
								pair={pair}
								selectedPropertyNames={props.selectedPropertyNames}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

type VariantPairCardProps = {
	pair: VariantPairViewModel;
	selectedPropertyNames: Set<CssLocPropertyName>;
};

function VariantPairCard(props: VariantPairCardProps): React.JSX.Element {
	const [isOpen, setIsOpen] = React.useState(false);

	return (
		<Card size="sm" className="p-2">
			<Button
				type="button"
				variant="outline"
				className="h-auto w-full justify-between gap-3 rounded-md px-3 py-2 text-left"
				aria-expanded={isOpen}
				onClick={() => {
					setIsOpen(!isOpen);
				}}
			>
				<span className="min-w-0 truncate">{props.pair.name}</span>
				<span className="shrink-0 text-muted-foreground">
					{props.pair.occurrences} occurrence
					{props.pair.occurrences === 1 ? "" : "s"}
				</span>
			</Button>
			{isOpen ? (
				<div className="mt-2 rounded-md border border-border p-2">
					<div className="mb-2 flex flex-wrap items-start gap-1.5">
						{props.pair.variants.map((variant) => (
							<PairVariantBlock
								key={variant.id}
								variant={variant}
								selectedPropertyNames={props.selectedPropertyNames}
							/>
						))}
					</div>
					<div className="flex flex-wrap gap-1">
						{props.pair.uniqueTexts.map((word) => (
							<span
								key={word}
								className="rounded-sm bg-muted px-1.5 py-0.5 text-xs/relaxed text-muted-foreground"
							>
								{word}
							</span>
						))}
					</div>
				</div>
			) : null}
		</Card>
	);
}

type PairVariantBlockProps = {
	variant: TextAuditVariantViewModel;
	selectedPropertyNames: Set<CssLocPropertyName>;
};

function PairVariantBlock(props: PairVariantBlockProps): React.JSX.Element {
	const properties = props.variant.properties.filter((property) =>
		props.selectedPropertyNames.has(property.name),
	);

	return (
		<Card size="sm" className="p-2">
			<div className="flex flex-col gap-1">
				{properties.map((property) => (
					<CssProp
						key={`${props.variant.id}-${property.name}`}
						name={property.name}
						text={property.value}
						isUnderlined={property.isSharedAcrossVariants}
					/>
				))}
			</div>
		</Card>
	);
}

function buildUniqueVariantPairs(
	textlets: Array<TextAuditTextletCardViewModel>,
	selectedPropertyNames: Set<CssLocPropertyName>,
): Array<VariantPairViewModel> {
	const pairMap = new Map<string, VariantPairViewModel>();

	for (const textlet of textlets) {
		if (textlet.variants.length < 2) {
			continue;
		}

		const chainVariants = [...textlet.variants].sort(
			compareVariantsForChain,
		);
		const key = createChainKey(chainVariants, selectedPropertyNames);
		const existing = pairMap.get(key);

		if (existing !== undefined) {
			existing.occurrences += 1;
			if (existing.uniqueTexts.includes(textlet.title) === false) {
				existing.uniqueTexts.push(textlet.title);
				existing.uniqueTexts.sort((a, b) => a.localeCompare(b));
			}
			continue;
		}

		pairMap.set(key, {
			id: key,
			name: chainVariants.map(getFontSizeLabel).join(" -> "),
			occurrences: 1,
			variants: chainVariants,
			uniqueTexts: [textlet.title],
		});
	}

	return Array.from(pairMap.values()).sort(compareVariantPairs);
}

function compareVariantsForChain(
	a: TextAuditVariantViewModel,
	b: TextAuditVariantViewModel,
): number {
	const aSize = getFontSizeNumber(a);
	const bSize = getFontSizeNumber(b);

	if (aSize !== bSize) {
		return bSize - aSize;
	}

	const aKey = createVariantStyleKey(a);
	const bKey = createVariantStyleKey(b);

	return aKey.localeCompare(bKey);
}

function createChainKey(
	variants: Array<TextAuditVariantViewModel>,
	selectedPropertyNames: Set<CssLocPropertyName>,
): string {
	return variants
		.map((variant) => createVariantStyleKey(variant, selectedPropertyNames))
		.join("||");
}

function createVariantStyleKey(
	variant: TextAuditVariantViewModel,
	selectedPropertyNames?: Set<CssLocPropertyName>,
): string {
	return variant.properties
		.filter((property) =>
			selectedPropertyNames === undefined
				? true
				: selectedPropertyNames.has(property.name),
		)
		.map((property) => `${property.name}:${property.value}`)
		.join("|");
}

function compareVariantPairs(
	a: VariantPairViewModel,
	b: VariantPairViewModel,
): number {
	const aFirst = a.variants[0];
	const bFirst = b.variants[0];
	const aLast = a.variants[a.variants.length - 1];
	const bLast = b.variants[b.variants.length - 1];

	return (
		getFontSizeNumber(bFirst) - getFontSizeNumber(aFirst) ||
		a.variants.length - b.variants.length ||
		getFontSizeNumber(bLast) - getFontSizeNumber(aLast) ||
		a.name.localeCompare(b.name)
	);
}

function getFontSizeLabel(variant: TextAuditVariantViewModel): string {
	const fontSize = variant.properties.find(
		(property) => property.name === "font-size",
	);
	return fontSize?.value ?? "-";
}

function getFontSizeNumber(variant: TextAuditVariantViewModel): number {
	const label = getFontSizeLabel(variant);
	const match = label.match(/-?\d+(\.\d+)?/);
	if (match === null) {
		return -Infinity;
	}

	return Number(match[0]);
}
