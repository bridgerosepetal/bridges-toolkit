import { describe, expect, it } from "vitest";
import { isUiToMainMessage } from "./messages";

describe("isUiToMainMessage", () => {
	it("accepts well-formed messages", () => {
		expect(
			isUiToMainMessage({ type: "SET_ACTIVE_PAGE", page: "text-audit" }),
		).toBe(true);
		expect(
			isUiToMainMessage({
				type: "RESIZE_PLUGIN_UI",
				width: 400,
				height: 600,
			}),
		).toBe(true);
		expect(
			isUiToMainMessage({
				type: "SET_TEXT_AUDIT_SELECTION_LOCK",
				isLocked: false,
			}),
		).toBe(true);
		expect(isUiToMainMessage({ type: "CLOSE_PLUGIN" })).toBe(true);
	});

	it("rejects non-objects and unknown types", () => {
		expect(isUiToMainMessage(null)).toBe(false);
		expect(isUiToMainMessage("CLOSE_PLUGIN")).toBe(false);
		expect(isUiToMainMessage({})).toBe(false);
		expect(isUiToMainMessage({ type: "DELETE_EVERYTHING" })).toBe(false);
	});

	it("rejects an unknown page id", () => {
		expect(
			isUiToMainMessage({ type: "SET_ACTIVE_PAGE", page: "nope" }),
		).toBe(false);
		expect(isUiToMainMessage({ type: "SET_ACTIVE_PAGE" })).toBe(false);
	});

	it("rejects invalid resize dimensions", () => {
		expect(
			isUiToMainMessage({
				type: "RESIZE_PLUGIN_UI",
				width: "400",
				height: 600,
			}),
		).toBe(false);
		expect(
			isUiToMainMessage({
				type: "RESIZE_PLUGIN_UI",
				width: 400,
				height: 0,
			}),
		).toBe(false);
		expect(
			isUiToMainMessage({
				type: "RESIZE_PLUGIN_UI",
				width: NaN,
				height: 600,
			}),
		).toBe(false);
	});

	it("rejects a lock message without a boolean", () => {
		expect(
			isUiToMainMessage({
				type: "SET_TEXT_AUDIT_SELECTION_LOCK",
				isLocked: "yes",
			}),
		).toBe(false);
	});
});
