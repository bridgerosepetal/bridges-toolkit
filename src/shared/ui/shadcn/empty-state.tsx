import * as React from "react";

import { cn } from "@shared/lib/utils";

function EmptyState({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="empty-state"
			className={cn(
				"flex min-h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-6 text-center",
				className,
			)}
			{...props}
		/>
	);
}

function EmptyStateHeader({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="empty-state-header"
			className={cn("flex flex-col items-center gap-1", className)}
			{...props}
		/>
	);
}

function EmptyStateTitle({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="empty-state-title"
			className={cn("text-sm font-medium text-foreground", className)}
			{...props}
		/>
	);
}

function EmptyStateDescription({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			data-slot="empty-state-description"
			className={cn("max-w-64 text-xs/relaxed text-muted-foreground", className)}
			{...props}
		/>
	);
}

export {
	EmptyState,
	EmptyStateDescription,
	EmptyStateHeader,
	EmptyStateTitle,
};
