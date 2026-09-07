import React from "react";

interface ScoreBadgeProps {
	score: number;
	priority: "HIGH" | "MEDIUM" | "LOW" | "POOR";
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, priority }) => {
	const colorMap = {
		HIGH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
		MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
		LOW: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
		POOR: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
	};
	return (
		<div className="flex items-center gap-2">
			<span className="text-xl font-bold">{score}</span>
			<span className={`rounded px-2 py-1 text-xs font-semibold ${colorMap[priority]}`}>{priority}</span>
		</div>
	);
};
