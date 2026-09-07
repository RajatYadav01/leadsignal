import React, { createContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

export interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [theme, setTheme] = useState<Theme>(() => {
		const stored = localStorage.getItem("theme");
		if (stored === "dark" || stored === "light") return stored;
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	});

	useEffect(() => {
		const root = document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

	return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};
