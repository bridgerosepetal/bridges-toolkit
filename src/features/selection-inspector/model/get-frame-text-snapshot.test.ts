import { describe, expect, it } from "vitest";
import {
	createFrameTextExport,
	getFrameTextSnapshot,
	type ExtractedFrameText,
} from "./get-frame-text-snapshot";

function frame(
	overrides: Partial<ExtractedFrameText> = {},
): ExtractedFrameText {
	return {
		id: "1:1",
		name: "Frame",
		type: "FRAME",
		width: 100,
		height: 50,
		text: "",
		frames: [],
		...overrides,
	};
}

function textNode(characters: string): SceneNode {
	return { type: "TEXT", characters } as unknown as SceneNode;
}

function frameNode(
	name: string,
	children: Array<SceneNode>,
	type: SceneNode["type"] = "FRAME",
): SceneNode {
	return {
		id: name,
		name,
		type,
		width: 100,
		height: 50,
		children,
	} as unknown as SceneNode;
}

describe("getFrameTextSnapshot", () => {
	it("collects text per frame and keeps nested frames separate", () => {
		const group = {
			type: "GROUP",
			children: [textNode("  Inside group  "), textNode("")],
		} as unknown as SceneNode;
		const snapshot = getFrameTextSnapshot([
			frameNode("Screen", [
				textNode("Title"),
				group,
				frameNode("Card", [textNode("Card copy")]),
			]),
			textNode("Not a frame"),
		]);

		expect(snapshot.frames).toHaveLength(1);
		const [screen] = snapshot.frames;
		expect(screen.text).toBe("Title\nInside group");
		expect(screen.frames.map((nested) => nested.text)).toEqual([
			"Card copy",
		]);
	});
});

describe("createFrameTextExport", () => {
	it("drops frames with no text anywhere in their subtree", () => {
		const result = createFrameTextExport({
			frames: [
				frame({ text: "Hello" }),
				frame({ frames: [frame({ text: "   " })] }),
			],
		});

		expect(result).toEqual({ frames: [{ text: "Hello" }] });
	});

	it("keeps empty parents that contain text in nested frames", () => {
		const result = createFrameTextExport({
			frames: [frame({ frames: [frame({ text: "Nested" })] })],
		});

		expect(result).toEqual({ frames: [{ frames: [{ text: "Nested" }] }] });
	});

	it("adds metadata only when asked", () => {
		const snapshot = { frames: [frame({ text: "Hi", name: "Hero" })] };

		expect(createFrameTextExport(snapshot).frames[0]).not.toHaveProperty(
			"name",
		);
		expect(
			createFrameTextExport(snapshot, { includeMetadata: true })
				.frames[0],
		).toEqual({
			text: "Hi",
			id: "1:1",
			name: "Hero",
			type: "FRAME",
			width: 100,
			height: 50,
		});
	});
});
