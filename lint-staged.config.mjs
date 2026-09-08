export default {
	// Frontend JavaScript/TypeScript Linting
	"**/*.{js,jsx,ts,tsx,mjs,cjs}": ["pnpm eslint --fix --"],

	// Backend Python Linting
	"apps/api/**/*.py": ["uv run --project apps/api/v1 ruff check --fix", "uv run --project apps/api/v1 ruff format"],

	// Code Formatting for All Shared Web/Config Files
	"**/*.{json,md,html,css,scss,js,jsx,ts,tsx,mjs,cjs,yaml,yml}": ["pnpm prettier --write --ignore-unknown --log-level warn --"],
};
