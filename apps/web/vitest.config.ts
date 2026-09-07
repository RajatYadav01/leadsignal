import path from "node:path";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./vitest.setup.ts",
	},
});
