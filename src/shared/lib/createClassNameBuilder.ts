export type ClassNameBuilder = {
	block: string;
	element: (name: string) => string;
	modifier: (name: string) => string;
};

export function createClassNameBuilder(block: string): ClassNameBuilder {
	return {
		block,
		element: (name: string) => `${block}--${name}`,
		modifier: (name: string) => `${block}_${name}`,
	};
}
