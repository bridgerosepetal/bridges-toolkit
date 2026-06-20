import React, { useEffect, useRef } from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";
import { InputConsole } from "../input-console/InputConsole";
import { MessageOutput } from "../message-output/MessageOutput";

export type InputConsoleLine = {
	id: number;
	type: "input";
	value: string;
	isActive: boolean;
};

export type OutputConsoleLine = {
	id: number;
	type: "output";
	value: string;
};

export type ConsoleLine = InputConsoleLine | OutputConsoleLine;

export type Props = {
	lines: Array<ConsoleLine>;
	onChangeActiveLine: (value: string) => void;
	onSubmitActiveLine: () => void;
	onHistoryUp: () => void;
	onHistoryDown: () => void;
};

export function Console(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("console");
	const listRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (listRef.current === null) {
			return;
		}
		listRef.current.scrollTop = listRef.current.scrollHeight;
	}, [props.lines]);

	return (
		<section className={className.block}>
			<div ref={listRef} className={className.element("list")}>
				{props.lines.map((line) => {
					if (line.type === "output") {
						return <MessageOutput key={line.id} text={line.value} />;
					}

					return (
						<InputConsole
							key={line.id}
							value={line.value}
							isActive={line.isActive}
							onChange={props.onChangeActiveLine}
							onSubmit={props.onSubmitActiveLine}
							onHistoryUp={props.onHistoryUp}
							onHistoryDown={props.onHistoryDown}
						/>
					);
				})}
			</div>
		</section>
	);
}
