import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path) => fileURLToPath(new URL(path, import.meta.url));

// Mirrors the `paths` aliases in tsconfig.json.
export default defineConfig({
	resolve: {
		alias: {
			"@app": fromRoot("./src/app"),
			"@pages": fromRoot("./src/pages"),
			"@widgets": fromRoot("./src/widgets"),
			"@features": fromRoot("./src/features"),
			"@shared": fromRoot("./src/shared"),
		},
	},
});
