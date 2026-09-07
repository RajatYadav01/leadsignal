export const formatCurrency = (value: number | null): string => {
	if (value === null || value === undefined) return "N/A";
	if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
	return `$${value}`;
};

export const getPriorityColor = (priority: string) => {
	const map: Record<string, string> = {
		HIGH: "text-green-600 dark:text-green-400",
		MEDIUM: "text-yellow-600 dark:text-yellow-400",
		LOW: "text-orange-600 dark:text-orange-400",
		POOR: "text-gray-600 dark:text-gray-400",
	};
	return map[priority] || "";
};
