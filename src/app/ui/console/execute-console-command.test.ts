import { describe, expect, it, vi } from "vitest";
import { executeConsoleCommand } from "./execute-console-command";

function createContext() {
	return {
		goToPage: vi.fn(),
		closePlugin: vi.fn(),
		clearConsole: vi.fn(),
		toggleWindowSize: vi.fn(() => "expanded"),
	};
}

describe("executeConsoleCommand", () => {
	it("switches to a known page", () => {
		const context = createContext();
		const result = executeConsoleCommand("page text-audit", context);

		expect(context.goToPage).toHaveBeenCalledWith("text-audit");
		expect(result.outputs[0].level).toBe("info");
	});

	it("rejects an unknown page", () => {
		const context = createContext();
		const result = executeConsoleCommand("page nope", context);

		expect(context.goToPage).not.toHaveBeenCalled();
		expect(result.outputs[0].level).toBe("error");
	});

	it("ignores empty input", () => {
		expect(executeConsoleCommand("   ", createContext())).toEqual({
			outputs: [],
			cleared: false,
		});
	});

	it.each(["constructor", "toString", "__proto__", "hasOwnProperty"])(
		"treats %s as an unknown command",
		(command) => {
			const result = executeConsoleCommand(command, createContext());

			expect(result.cleared).toBe(false);
			expect(result.outputs).toEqual([
				{ text: `Unknown command: ${command}`, level: "error" },
			]);
		},
	);
});
