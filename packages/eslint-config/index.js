import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**", "**/.turbo/**", "**/types.generated.d.ts"],
	},

	js.configs.recommended,

	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ["**/*.{ts,tsx,js,jsx,mts,cts}"],
	})),

	{
		files: ["**/*.{ts,tsx,js,jsx,mts,cts}"],
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
);