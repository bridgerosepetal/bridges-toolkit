import { describe, expect, it } from "vitest";
import { auditTextlets } from "./audit-textlets";
import type { ExtractedTextNode, ExtractedTextNodeStyle } from "./types";

let nextId = 1;

function createNode(
	text: string,
	options: {
		frameGroupId?: string;
		frameId?: string;
		style?: ExtractedTextNodeStyle;
		y?: number;
	} = {},
): ExtractedTextNode {
	const id = `node-${nextId++}`;

	return {
		id,
		frameId: options.frameId ?? "frame-1",
		frameName: options.frameId ?? "frame-1",
		text,
		x: 0,
		y: options.y ?? 0,
		width: 100,
		height: 20,
		frameWidth: 400,
		frameHeight: 800,
		style: options.style ?? { "font-size": 16, "font-weight": 400 },
		context: {
			frameGroupId: options.frameGroupId ?? "group-1",
			frameGroupTreeDepth: 1,
		},
	};
}

describe("auditTextlets", () => {
	it("groups near-identical copy into one textlet", () => {
		const result = auditTextlets([
			createNode("Get started"),
			createNode("Get startd", { y: 40 }),
			createNode("Cancel", { y: 80 }),
		]);

		expect(result.textlets.map((textlet) => textlet.instances.length)).toEqual([
			1, 2,
		]);
		expect(result.stats.totalTextlets).toBe(2);
		expect(result.stats.totalInstances).toBe(3);
	});

	it("normalizes whitespace and case before comparing", () => {
		const result = auditTextlets([
			createNode("Learn more"),
			createNode("  learn   MORE ", { y: 40 }),
		]);

		expect(result.textlets).toHaveLength(1);
		expect(result.textlets[0].totalInstancesCount).toBe(2);
	});

	it("keeps frame groups separate", () => {
		const result = auditTextlets([
			createNode("Subscribe", { frameGroupId: "group-1" }),
			createNode("Subscribe", { frameGroupId: "group-2" }),
		]);

		expect(result.textlets).toHaveLength(2);
	});

	it("skips empty text and nodes outside a frame group", () => {
		const ungrouped = createNode("Orphan");
		ungrouped.context = {};

		const result = auditTextlets([createNode("   "), ungrouped]);

		expect(result.textlets).toHaveLength(0);
		expect(result.stats.totalInputNodes).toBe(2);
		expect(result.stats.totalTextNodes).toBe(1);
	});

	it("splits a textlet into variants by style", () => {
		const result = auditTextlets([
			createNode("Price", { style: { "font-size": 16 } }),
			createNode("Price", { style: { "font-size": 16 }, y: 40 }),
			createNode("Price", { style: { "font-size": 14 }, y: 80 }),
		]);

		expect(result.textlets).toHaveLength(1);
		const [textlet] = result.textlets;
		expect(textlet.uniqueVariantsCount).toBe(2);
		// The most-used variant comes first.
		expect(textlet.variants[0].style["font-size"]).toBe(16);
		expect(textlet.variants[0].instances).toHaveLength(2);
		expect(result.stats.totalVariantPairings).toBe(1);
	});

	it("only compares the configured style properties", () => {
		const nodes = [
			createNode("Total", { style: { "font-size": 16, "font-weight": 400 } }),
			createNode("Total", {
				style: { "font-size": 16, "font-weight": 700 },
				y: 40,
			}),
		];

		expect(auditTextlets(nodes).textlets[0].uniqueVariantsCount).toBe(2);
		expect(
			auditTextlets(nodes, { supportedStyleProperties: ["font-size"] })
				.textlets[0].uniqueVariantsCount,
		).toBe(1);
	});
});
