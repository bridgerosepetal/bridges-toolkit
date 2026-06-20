import { renderUi } from "./RunScreenView";
import { executeConsoleCommand } from "./console/execute-console-command";
import type { PageId } from "@shared/config/PageId";
import { LISTED_PAGE_META } from "@app/pages/page-meta";
import { createUiPageRuntimes } from "@app/pages/page-ui-registry";
import type {
	ConsoleLine,
	InputConsoleLine,
} from "@shared/ui/console/Console";
import {
	RUN_UI_HEIGHT,
	RUN_UI_WIDTHS,
	type RunUiSize,
} from "@app/config/run-ui-size";
import { createUiBridge } from "./ui-bridge";

type UiState = {
	currentPage: PageId;
	windowSize: RunUiSize;
	console: {
		isVisible: boolean;
		lines: Array<ConsoleLine>;
		nextLineId: number;
		history: Array<string>;
		historyIndex: number | null;
		draftValue: string;
	};
};

export default function renderRunUi(rootNode: HTMLElement): void {
	const bridge = createUiBridge();
	const pageRuntimes = createUiPageRuntimes(bridge);
	const initialPage = LISTED_PAGE_META[0]?.id ?? "index";

	const state: UiState = {
		currentPage: initialPage,
		windowSize: "compact",
		console: {
			isVisible: false,
			lines: [{ id: 1, type: "input", value: "", isActive: true }],
			nextLineId: 2,
			history: [],
			historyIndex: null,
			draftValue: "",
		},
	};
	bridge.setActivePage(state.currentPage);

	const goToPage = (page: PageId): void => {
		state.currentPage = page;
		bridge.setActivePage(page);
		pageRuntimes[page].controller.enter(render);
	};

	const ensureActiveConsoleLine = (): void => {
		const hasActiveLine = state.console.lines.some(
			(line) => line.type === "input" && line.isActive,
		);
		if (hasActiveLine) {
			return;
		}

		state.console.lines.push({
			id: state.console.nextLineId++,
			type: "input",
			value: "",
			isActive: true,
		});
	};

	const clearConsole = (): void => {
		state.console.lines = [
			{
				id: state.console.nextLineId++,
				type: "input",
				value: "",
				isActive: true,
			},
		];
	};

	const getActiveInputLine = (): InputConsoleLine | undefined => {
		return state.console.lines.find(
			(line): line is InputConsoleLine =>
				line.type === "input" && line.isActive,
		);
	};

	const moveHistory = (direction: "up" | "down"): void => {
		const activeLine = getActiveInputLine();
		if (activeLine === undefined || state.console.history.length === 0) {
			return;
		}

		if (direction === "up") {
			if (state.console.historyIndex === null) {
				state.console.draftValue = activeLine.value;
				state.console.historyIndex = state.console.history.length - 1;
			} else if (state.console.historyIndex > 0) {
				state.console.historyIndex -= 1;
			}

			activeLine.value = state.console.history[state.console.historyIndex];
			render();
			return;
		}

		if (state.console.historyIndex === null) {
			return;
		}

		if (state.console.historyIndex < state.console.history.length - 1) {
			state.console.historyIndex += 1;
			activeLine.value = state.console.history[state.console.historyIndex];
		} else {
			state.console.historyIndex = null;
			activeLine.value = state.console.draftValue;
		}

		render();
	};

	window.addEventListener("keydown", (event) => {
		if (event.key !== "F12") {
			return;
		}
		event.preventDefault();
		state.console.isVisible = !state.console.isVisible;
		if (state.console.isVisible) {
			ensureActiveConsoleLine();
		}
		render();
	});

	const render = () => {
		const title = "Bridges Toolkit";
		const closePlugin = (): void => {
			bridge.closePlugin();
		};
		const toggleWindowSize = (): string => {
			state.windowSize =
				state.windowSize === "compact" ? "expanded" : "compact";
			bridge.resizePluginUi(
				RUN_UI_WIDTHS[state.windowSize],
				RUN_UI_HEIGHT,
			);
			render();
			return state.windowSize;
		};
		const navigateToPage = (page: PageId): void => {
			goToPage(page);
			render();
		};

		renderUi(
			rootNode,
			{
				title,
				currentPage: state.currentPage,
				listedPages: LISTED_PAGE_META,
				pageElement: pageRuntimes[state.currentPage].renderPage({
					title,
					onGoToPage: navigateToPage,
					onClose: closePlugin,
					render,
					windowSize: state.windowSize,
				}),
				console: {
					isVisible: state.console.isVisible,
					lines: state.console.lines,
				},
			},
			{
				onGoToPage: navigateToPage,
				console: {
					onChangeActiveLine: (value) => {
						const activeLine = getActiveInputLine();
						if (activeLine === undefined) {
							return;
						}
						activeLine.value = value;
						if (state.console.historyIndex === null) {
							state.console.draftValue = value;
						}
						render();
					},
					onHistoryUp: () => {
						moveHistory("up");
					},
					onHistoryDown: () => {
						moveHistory("down");
					},
					onSubmitActiveLine: () => {
						const activeLine = getActiveInputLine();
						if (activeLine === undefined) {
							return;
						}

						const command = activeLine.value.trim();
						if (command.length > 0) {
							state.console.history.push(activeLine.value);
						}
						state.console.historyIndex = null;
						state.console.draftValue = "";

						activeLine.isActive = false;
						const result = executeConsoleCommand(activeLine.value, {
							goToPage,
							closePlugin,
							clearConsole,
							toggleWindowSize,
						});
						if (!result.cleared) {
							for (const output of result.outputs) {
								state.console.lines.push({
									id: state.console.nextLineId++,
									type: "output",
									value: output.text,
								});
								const prefixed = `Bridges Toolkit: ${output.text}`;
								if (output.level === "error") {
									console.warn(prefixed);
								} else {
									console.info(prefixed);
								}
							}
						}
						ensureActiveConsoleLine();
						render();
					},
				},
			},
		);
	};

	bridge.onMessage((message) => {
		pageRuntimes[state.currentPage].controller.handleMessage(message, render);
	});

	render();
}

export { renderRunUi };
