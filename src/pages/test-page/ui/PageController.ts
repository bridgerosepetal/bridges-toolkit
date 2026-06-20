import {
	createEmptyPageController,
	type PageController,
} from "@shared/lib/PageController";

function createTestPageController(): PageController {
	return createEmptyPageController();
}

export const createPageController = createTestPageController;
