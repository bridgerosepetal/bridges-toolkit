import React from "react";
import ReactDOM from "react-dom";
import {
	Console,
	type ConsoleLine,
} from "@shared/ui/console/Console";
import { Footer } from "@widgets/footer/ui/Footer";
import { Header } from "@widgets/header/ui/Header";
import { ButtonTurn } from "@shared/ui/button-turn/ButtonTurn";
import { TabList } from "@shared/ui/tab-list/TabList";
import { Tab } from "@shared/ui/tab/Tab";
import type { PageId } from "@shared/config/PageId";
import type { PageMeta } from "@app/pages/page-meta";

export type RenderUiActions = {
	onGoToPage: (page: PageId) => void;
	console: {
		onChangeActiveLine: (value: string) => void;
		onSubmitActiveLine: () => void;
		onHistoryUp: () => void;
		onHistoryDown: () => void;
	};
};

export type UiViewModel = {
	title: string;
	currentPage: PageId;
	listedPages: Array<PageMeta>;
	pageElement: React.ReactNode;
	console: {
		isVisible: boolean;
		lines: Array<ConsoleLine>;
	};
};

export function renderUi(
	rootNode: HTMLElement,
	model: UiViewModel,
	actions: RenderUiActions,
): void {
	ReactDOM.render(
		<SelectionInspectorScreen model={model} actions={actions} />,
		rootNode,
	);
}

type ScreenProps = {
	model: UiViewModel;
	actions: RenderUiActions;
};

function SelectionInspectorScreen(props: ScreenProps): React.JSX.Element {
	const tabListInnerRef = React.useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = React.useState<boolean>(false);
	const [canScrollRight, setCanScrollRight] = React.useState<boolean>(false);

	const updateScrollState = React.useCallback((): void => {
		const element = tabListInnerRef.current;
		if (element === null) {
			setCanScrollLeft(false);
			setCanScrollRight(false);
			return;
		}

		const epsilon = 1;
		const nextCanScrollLeft = element.scrollLeft > epsilon;
		const nextCanScrollRight =
			element.scrollLeft + element.clientWidth <
			element.scrollWidth - epsilon;

		setCanScrollLeft(nextCanScrollLeft);
		setCanScrollRight(nextCanScrollRight);
	}, []);

	React.useEffect(() => {
		updateScrollState();

		window.addEventListener("resize", updateScrollState);
		return () => {
			window.removeEventListener("resize", updateScrollState);
		};
	}, [updateScrollState, props.model.listedPages, props.model.currentPage]);

	const scrollTabs = (direction: "left" | "right"): void => {
		const element = tabListInnerRef.current;
		if (element === null) {
			return;
		}

		const distance = direction === "left" ? -140 : 140;
		element.scrollBy({ left: distance, behavior: "smooth" });
		window.setTimeout(updateScrollState, 180);
	};

	return (
		<div className="app-shell dark">
			<Header>
				<ButtonTurn
					variant="left"
					text="<"
					ariaLabel="Scroll tabs left"
					disabled={!canScrollLeft}
					onClick={() => scrollTabs("left")}
				/>
				<TabList
					innerRef={tabListInnerRef}
					onInnerScroll={updateScrollState}
				>
					{props.model.listedPages.map((tabPage) => (
						<Tab
							key={tabPage.id}
							text={tabPage.name}
							isSelected={props.model.currentPage === tabPage.id}
							onClick={() => props.actions.onGoToPage(tabPage.id)}
						></Tab>
					))}
				</TabList>
				<ButtonTurn
					variant="right"
					text=">"
					ariaLabel="Scroll tabs right"
					disabled={!canScrollRight}
					onClick={() => scrollTabs("right")}
				/>
			</Header>
			<div className="app-shell--page">{props.model.pageElement}</div>
			{props.model.console.isVisible ? (
				<footer className="app-shell--console">
					<Console
						lines={props.model.console.lines}
						onChangeActiveLine={
							props.actions.console.onChangeActiveLine
						}
						onSubmitActiveLine={
							props.actions.console.onSubmitActiveLine
						}
						onHistoryUp={props.actions.console.onHistoryUp}
						onHistoryDown={props.actions.console.onHistoryDown}
					/>
				</footer>
			) : null}
			<Footer />
		</div>
	);
}
