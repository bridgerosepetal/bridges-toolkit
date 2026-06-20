module.exports = function overrideUiEsbuildConfig(buildOptions) {
	return {
		...buildOptions,
		jsxFactory: "React.createElement",
		jsxFragment: "React.Fragment",
	};
};
