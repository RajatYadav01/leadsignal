import React from "react";

interface CardProps {
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => {
	const isClickable = Boolean(onClick);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (!onClick) return;

		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onClick();
		}
	};

	return (
		<div
			className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
				isClickable ? "cursor-pointer transition hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none" : ""
			} ${className}`}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role={isClickable ? "button" : undefined}
			tabIndex={isClickable ? 0 : undefined}>
			{children}
		</div>
	);
};

export const CardContent: React.FC<CardProps> = ({ children, className = "" }) => <div className={`p-2 ${className}`}>{children}</div>;
