export type PageConfig<Id extends string = string> = {
	id: Id;
	name: string;
	isListed: boolean;
};

export function createPageConfig<const Id extends string>(
	config: PageConfig<Id>,
): PageConfig<Id> {
	return config;
}
