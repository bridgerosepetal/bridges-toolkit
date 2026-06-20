export type ExtractedFrameText = {
	id: string;
	name: string;
	type: SceneNode["type"];
	width: number;
	height: number;
	text: string;
	frames: Array<ExtractedFrameText>;
};

export type FrameTextSnapshot = {
	frames: Array<ExtractedFrameText>;
};

export type FrameTextExportNode = {
	text?: string;
	frames?: Array<FrameTextExportNode>;
	id?: string;
	name?: string;
	type?: SceneNode["type"];
	width?: number;
	height?: number;
};

export type FrameTextExport = {
	frames: Array<FrameTextExportNode>;
};

export type FrameTextExportOptions = {
	includeMetadata?: boolean;
};

export function getFrameTextSnapshot(
	nodes: readonly SceneNode[],
): FrameTextSnapshot {
	const frames = nodes.filter(isFrameLikeNode).map(extractFrameText);

	return {
		frames,
	};
}

export function createFrameTextExport(
	snapshot: FrameTextSnapshot,
	options: FrameTextExportOptions = {},
): FrameTextExport {
	return {
		frames: snapshot.frames
			.map((frame) => mapFrameForExport(frame, options))
			.filter((frame): frame is FrameTextExportNode => frame !== null),
	};
}

type FrameLikeNode =
	| FrameNode
	| ComponentNode
	| ComponentSetNode
	| InstanceNode
	| SectionNode;

function isFrameLikeNode(node: SceneNode): node is FrameLikeNode {
	return (
		node.type === "FRAME" ||
		node.type === "COMPONENT" ||
		node.type === "COMPONENT_SET" ||
		node.type === "INSTANCE" ||
		node.type === "SECTION"
	);
}

function extractFrameText(node: FrameLikeNode): ExtractedFrameText {
	const nestedFrames: Array<ExtractedFrameText> = [];
	const textFragments: Array<string> = [];

	for (const child of node.children) {
		if (isFrameLikeNode(child)) {
			nestedFrames.push(extractFrameText(child));
			continue;
		}

		textFragments.push(...collectTextFragments(child));
	}

	return {
		id: node.id,
		name: node.name,
		type: node.type,
		width: node.width,
		height: node.height,
		text: joinTextFragments(textFragments),
		frames: nestedFrames,
	};
}

function collectTextFragments(node: SceneNode): Array<string> {
	if (isFrameLikeNode(node)) {
		return [];
	}

	if (node.type === "TEXT") {
		return [node.characters];
	}

	if (!hasChildren(node)) {
		return [];
	}

	const fragments: Array<string> = [];
	for (const child of node.children) {
		fragments.push(...collectTextFragments(child));
	}
	return fragments;
}

function hasChildren(node: SceneNode): node is SceneNode & ChildrenMixin {
	return "children" in node;
}

function joinTextFragments(fragments: Array<string>): string {
	return fragments
		.map((fragment) => fragment.trim())
		.filter((fragment) => fragment.length > 0)
		.join("\n");
}

function mapFrameForExport(
	frame: ExtractedFrameText,
	options: FrameTextExportOptions,
): FrameTextExportNode | null {
	const nestedFrames = frame.frames
		.map((nestedFrame) => mapFrameForExport(nestedFrame, options))
		.filter(
			(nestedFrame): nestedFrame is FrameTextExportNode =>
				nestedFrame !== null,
		);
	const hasText = frame.text.trim().length > 0;

	if (!hasText && nestedFrames.length === 0) {
		return null;
	}

	const exportedFrame: FrameTextExportNode = {
	};
	if (hasText) {
		exportedFrame.text = frame.text;
	}
	if (nestedFrames.length > 0) {
		exportedFrame.frames = nestedFrames;
	}

	if (options.includeMetadata === true) {
		exportedFrame.id = frame.id;
		exportedFrame.name = frame.name;
		exportedFrame.type = frame.type;
		exportedFrame.width = frame.width;
		exportedFrame.height = frame.height;
	}

	return exportedFrame;
}
