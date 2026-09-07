import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api, fetchDashboard } from "@/services/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Card, CardContent } from "@/components/ui/Card";
import { FunnelChart, Funnel, Tooltip } from "recharts";

interface DashboardStats {
	total_leads: number;
	valid_leads: number;
	icp_matches: number;
	high_priority: number;
}

interface ApiErrorResponse {
	detail?: string;
	message?: string;
}

export function DashboardPage() {
	const { projectId } = useParams<{ projectId: string }>();

	const queryClient = useQueryClient();

	const [analysisMessage, setAnalysisMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const {
		data: stats,
		isLoading,
		error,
		refetch,
	} = useQuery<DashboardStats>({
		queryKey: ["dashboard", projectId],
		queryFn: () => fetchDashboard(projectId as string),
		enabled: Boolean(projectId),
		retry: 1,
	});

	const analyzeMutation = useMutation<unknown, AxiosError<ApiErrorResponse>, void>({
		mutationFn: () => {
			if (!projectId) {
				throw new Error("No project selected.");
			}

			return api.post(`/projects/${projectId}/analyze/`);
		},

		onSuccess: () => {
			setAnalysisMessage({
				type: "success",
				text: "Analysis completed successfully! Dashboard updated.",
			});

			queryClient.invalidateQueries({
				queryKey: ["dashboard", projectId],
			});

			queryClient.invalidateQueries({
				queryKey: ["leads", projectId],
			});

			setTimeout(() => {
				setAnalysisMessage(null);
			}, 5000);
		},

		onError: (error) => {
			const errorMsg =
				error.response?.data?.detail ?? error.response?.data?.message ?? error.message ?? "Analysis failed. Please try again.";

			setAnalysisMessage({
				type: "error",
				text: errorMsg,
			});

			setTimeout(() => {
				setAnalysisMessage(null);
			}, 5000);
		},
	});

	const handleAnalyze = () => {
		setAnalysisMessage(null);
		analyzeMutation.mutate();
	};

	if (!projectId) {
		return <ErrorMessage message="No project selected. Please go back and choose a project." />;
	}

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		const errorMessage = error instanceof Error ? error.message : "Failed to load dashboard data.";

		return <ErrorMessage message={`Unable to fetch dashboard for this project. ${errorMessage}`} retry={() => refetch()} />;
	}

	if (!stats) {
		return <ErrorMessage message="No dashboard data available for this project." />;
	}

	const { total_leads = 0, valid_leads = 0, icp_matches = 0, high_priority = 0 } = stats;

	const funnelData = [
		{
			name: "Raw Leads",
			value: total_leads,
			fill: "#2563EB",
		},
		{
			name: "Valid",
			value: valid_leads,
			fill: "#60A5FA",
		},
		{
			name: "ICP Matches",
			value: icp_matches,
			fill: "#93C5FD",
		},
		{
			name: "High Priority",
			value: high_priority,
			fill: "#F59E0B",
		},
		{
			name: "Sales Ready",
			value: Math.floor(high_priority * 0.4),
			fill: "#16A34A",
		},
	];

	const hasData = total_leads > 0 || valid_leads > 0 || icp_matches > 0 || high_priority > 0;

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Dashboard</h1>

				<button
					onClick={handleAnalyze}
					disabled={analyzeMutation.isPending}
					className="bg-primary flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
					{analyzeMutation.isPending ? (
						<>
							<svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />

								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							Analyzing...
						</>
					) : (
						"Analyze Leads"
					)}
				</button>
			</div>

			{analysisMessage && (
				<div
					role="alert"
					className={`mb-4 rounded-lg border p-3 ${
						analysisMessage.type === "success"
							? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
							: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
					}`}>
					{analysisMessage.text}
				</div>
			)}

			{!hasData ? (
				<div className="py-12 text-center text-gray-500 dark:text-gray-400">
					<p className="text-lg">No lead data yet.</p>
					<p className="text-sm">Upload a CSV file to start analyzing leads.</p>
				</div>
			) : (
				<>
					<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardContent>
								<div className="text-sm text-gray-500 dark:text-gray-400">Total Leads</div>

								<div className="text-2xl font-bold">{total_leads}</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent>
								<div className="text-sm text-gray-500 dark:text-gray-400">Valid Leads</div>

								<div className="text-2xl font-bold">{valid_leads}</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent>
								<div className="text-sm text-gray-500 dark:text-gray-400">ICP Matches</div>

								<div className="text-2xl font-bold">{icp_matches}</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent>
								<div className="text-sm text-gray-500 dark:text-gray-400">High Priority</div>

								<div className="text-2xl font-bold">{high_priority}</div>
							</CardContent>
						</Card>
					</div>

					<div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
						<h2 className="mb-4 text-lg font-semibold">Lead Funnel</h2>

						<div className="flex justify-center">
							<FunnelChart width={500} height={300}>
								<Tooltip />

								<Funnel data={funnelData} dataKey="value" />
							</FunnelChart>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
