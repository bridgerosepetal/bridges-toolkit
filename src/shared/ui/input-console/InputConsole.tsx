import React, { useEffect, useRef } from "react";
import { createClassNameBuilder } from "@shared/lib/createClassNameBuilder";

export type Props = {
	value: string;
	isActive: boolean;
	onChange: (value: string) => void;
	onSubmit: () => void;
	onHistoryUp: () => void;
	onHistoryDown: () => void;
};

export function InputConsole(props: Props): React.JSX.Element {
	const className = createClassNameBuilder("input-console");
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (props.isActive) {
			inputRef.current?.focus();
		}
	}, [props.isActive]);

	return (
		<div className={className.block}>
			<div className={className.element("prefix")}>{">"}</div>
			<input
				ref={inputRef}
				className={className.element("field")}
				type="text"
				value={props.value}
				readOnly={!props.isActive}
				onChange={(event) => {
					if (!props.isActive) {
						return;
					}
					props.onChange(event.target.value);
				}}
				onKeyDown={(event) => {
					if (!props.isActive) {
						return;
					}

					if (event.key === "ArrowUp") {
						event.preventDefault();
						props.onHistoryUp();
						return;
					}

					if (event.key === "ArrowDown") {
						event.preventDefault();
						props.onHistoryDown();
						return;
					}

					if (event.key === "Enter") {
						event.preventDefault();
						props.onSubmit();
					}
				}}
			/>
		</div>
	);
}
