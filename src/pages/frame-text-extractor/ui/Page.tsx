import React from "react";
import { Button } from "@shared/ui/shadcn/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@shared/ui/shadcn/card";
import {
	EmptyState,
	EmptyStateDescription,
	EmptyStateHeader,
	EmptyStateTitle,
} from "@shared/ui/shadcn/empty-state";
import type { ExtractedFrameText, FrameTextSnapshot } from "@features/selection-inspector/model/get-frame-text-snapshot";
export type Props = {
	status: string;
	snapshot: FrameTextSnapshot | null;
	onRefresh: () => void;
	onCopyAll: () => void;
	onClose: () => void;
};

export function FrameTextExtractorPage(props: Props): React.JSX.Element {
	const frames = props.snapshot?.frames ?? [];
	const firstFrame = frames[0] ?? null;
	const preview = buildTextPreview(frames);

	return (
		<main className="flex flex-col gap-3 p-4 text-foreground">
			<header className="flex flex-col gap-1">
				<h1 className="font-heading text-sm font-medium">
					Frame Text Extractor
				</h1>
				<p className="text-xs/relaxed text-muted-foreground">
					{props.status}
				</p>
			</header>

			<Card>
				<CardHeader>
					<CardTitle>Text Preview</CardTitle>
					<CardDescription>
						Extracted text from selected frames and nested frames.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{preview.length > 0 ? (
						<pre className="max-h-56 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs/relaxed whitespace-pre-wrap text-foreground">
							{preview}
						</pre>
					) : (
						<EmptyState className="min-h-28">
							<EmptyStateHeader>
								<EmptyStateTitle>No text found</EmptyStateTitle>
								<EmptyStateDescription>
									Select one or more frames to extract text recursively.
								</EmptyStateDescription>
							</EmptyStateHeader>
						</EmptyState>
					)}
				</CardContent>
			</Card>

			<Card size="sm">
				<CardHeader>
					<CardTitle>Frame Info</CardTitle>
				</CardHeader>
				<CardContent>
					{firstFrame === null ? (
						<EmptyState className="min-h-24">
							<EmptyStateHeader>
								<EmptyStateTitle>No frames selected</EmptyStateTitle>
								<EmptyStateDescription>
									Select one or more frames to inspect frame metadata.
								</EmptyStateDescription>
							</EmptyStateHeader>
						</EmptyState>
					) : (
						<div className="grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
							<InfoRow
								label="Selected Frames"
								value={String(frames.length)}
							/>
							<InfoRow label="First Frame" value={firstFrame.name} />
							<InfoRow label="Frame Id" value={firstFrame.id} />
							<InfoRow
								label="Size"
								value={`${firstFrame.width.toFixed(1)} x ${firstFrame.height.toFixed(1)}`}
							/>
							<InfoRow
								label="Nested Frames"
								value={String(countNestedFrames(firstFrame))}
							/>
							<InfoRow
								label="Text Characters"
								value={String(countTextCharacters(firstFrame))}
							/>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="flex flex-wrap gap-2">
				<Button type="button" onClick={props.onRefresh}>
					Refresh
				</Button>
				<Button
					type="button"
					variant="secondary"
					onClick={props.onCopyAll}
				>
					Copy all JSON
				</Button>
				<Button type="button" variant="ghost" onClick={props.onClose}>
					Close
				</Button>
			</div>
		</main>
	);
}

type InfoRowProps = {
	label: string;
	value: string;
};

function InfoRow(props: InfoRowProps): React.JSX.Element {
	return (
		<div className="flex min-w-0 flex-col gap-1 rounded-md border border-border bg-muted/30 p-2">
			<span className="text-[0.625rem]/relaxed font-medium text-muted-foreground">
				{props.label}
			</span>
			<span className="break-words text-xs/relaxed text-foreground">
				{props.value}
			</span>
		</div>
	);
}

function countNestedFrames(frame: ExtractedFrameText): number {
	return frame.frames.reduce((total, nestedFrame) => {
		return total + 1 + countNestedFrames(nestedFrame);
	}, 0);
}

function countTextCharacters(frame: ExtractedFrameText): number {
	return frame.frames.reduce((total, nestedFrame) => {
		return total + countTextCharacters(nestedFrame);
	}, frame.text.length);
}

function buildTextPreview(frames: Array<ExtractedFrameText>): string {
	return frames
		.map((frame) => flattenFrameText(frame))
		.filter((text) => text.length > 0)
		.join("\n\n");
}

function flattenFrameText(frame: ExtractedFrameText): string {
	const nestedText = frame.frames
		.map((nestedFrame) => flattenFrameText(nestedFrame))
		.filter((text) => text.length > 0);

	return [frame.text, ...nestedText]
		.filter((segment) => segment.length > 0)
		.join("\n");
}
