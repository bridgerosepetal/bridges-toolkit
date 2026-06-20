import * as React from "react";

import { cn } from "@shared/lib/utils";

type TabsValue = string;

type TabsContextValue = {
	value: TabsValue;
	setValue: (value: TabsValue) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(componentName: string): TabsContextValue {
	const context = React.useContext(TabsContext);

	if (context === null) {
		throw new Error(`${componentName} must be used within Tabs.`);
	}

	return context;
}

type TabsProps = Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> & {
	defaultValue: TabsValue;
	value?: TabsValue;
	onValueChange?: (value: TabsValue) => void;
};

function Tabs({
	className,
	defaultValue,
	value,
	onValueChange,
	...props
}: TabsProps): React.JSX.Element {
	const [internalValue, setInternalValue] = React.useState(defaultValue);
	const activeValue = value ?? internalValue;

	const context = React.useMemo<TabsContextValue>(
		() => ({
			value: activeValue,
			setValue: (nextValue) => {
				setInternalValue(nextValue);
				onValueChange?.(nextValue);
			},
		}),
		[activeValue, onValueChange],
	);

	return (
		<TabsContext.Provider value={context}>
			<div
				data-slot="tabs"
				className={cn("flex flex-col gap-3", className)}
				{...props}
			/>
		</TabsContext.Provider>
	);
}

function TabsList({
	className,
	...props
}: React.ComponentProps<"div">): React.JSX.Element {
	return (
		<div
			role="tablist"
			data-slot="tabs-list"
			className={cn(
				"inline-flex h-8 w-fit items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

type TabsTriggerProps = React.ComponentProps<"button"> & {
	value: TabsValue;
};

function TabsTrigger({
	className,
	value,
	onClick,
	...props
}: TabsTriggerProps): React.JSX.Element {
	const tabs = useTabsContext("TabsTrigger");
	const isActive = tabs.value === value;

	return (
		<button
			type="button"
			role="tab"
			data-slot="tabs-trigger"
			data-active={isActive ? "" : undefined}
			aria-selected={isActive}
			className={cn(
				"inline-flex h-6 items-center justify-center rounded-sm px-2 text-xs font-medium whitespace-nowrap transition-colors outline-none hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-active:bg-background data-active:text-foreground data-active:shadow-sm",
				className,
			)}
			onClick={(event) => {
				tabs.setValue(value);
				onClick?.(event);
			}}
			{...props}
		/>
	);
}

type TabsContentProps = React.ComponentProps<"div"> & {
	value: TabsValue;
};

function TabsContent({
	className,
	value,
	...props
}: TabsContentProps): React.JSX.Element {
	const tabs = useTabsContext("TabsContent");
	const isActive = tabs.value === value;

	return (
		<div
			role="tabpanel"
			data-slot="tabs-content"
			hidden={!isActive}
			className={cn(
				"outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
				className,
			)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
