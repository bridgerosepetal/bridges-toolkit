import {
	createEmptyPageController,
	type PageController,
} from "@shared/lib/PageController";

function createIndexPageController(): PageController {
	return createEmptyPageController();
}

export const createPageController = createIndexPageController;
