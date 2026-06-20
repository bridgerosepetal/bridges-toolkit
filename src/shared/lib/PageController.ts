export type Render = () => void;

export type PageController = {
	enter: (render: Render) => void;
	handleMessage: (message: unknown, render: Render) => void;
};

export function createEmptyPageController(): PageController {
	return {
		enter() {},
		handleMessage() {},
	};
}
