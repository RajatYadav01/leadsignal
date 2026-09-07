import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import type { Contact, LeadSignal } from "@/types";
import { api } from "@/services/api";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SignalIcons } from "@/components/SignalIcons";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

export function LeadDetailPage() {
	const { leadId } = useParams();
	const navigate = useNavigate();

	const {
		data: lead,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["lead", leadId],
		queryFn: () => api.get(`/leads/${leadId}/`).then((res) => res.data),
		enabled: !!leadId,
		retry: 1,
	});

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		return <ErrorMessage message="Failed to load lead details. Please try again." retry={() => window.location.reload()} />;
	}

	if (!lead) {
		return <ErrorMessage message="Lead not found." />;
	}

	return (
		<div className="mx-auto max-w-4xl p-6">
			<button
				onClick={() => navigate(-1)}
				className="mb-4 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
				<ArrowLeft size={20} />
				Back to Leads
			</button>

			<div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<div className="mb-6 flex items-start justify-between">
					<div>
						<h1 className="text-2xl font-bold">{lead.company_name}</h1>
						<a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
							{lead.website}
						</a>
					</div>
					<div className="flex items-center gap-4">
						<ScoreBadge score={lead.lead_score} priority={lead.priority} />
					</div>
				</div>

				<div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
					<div>
						<div className="text-sm text-gray-500 dark:text-gray-400">Industry</div>
						<div className="font-medium">{lead.industry || "N/A"}</div>
					</div>
					<div>
						<div className="text-sm text-gray-500 dark:text-gray-400">Employees</div>
						<div className="font-medium">{lead.employees || "N/A"}</div>
					</div>
					<div>
						<div className="text-sm text-gray-500 dark:text-gray-400">Revenue</div>
						<div className="font-medium">{lead.revenue ? `$${Number(lead.revenue).toLocaleString()}` : "N/A"}</div>
					</div>
					<div>
						<div className="text-sm text-gray-500 dark:text-gray-400">Country</div>
						<div className="font-medium">{lead.country || "N/A"}</div>
					</div>
					<div>
						<div className="text-sm text-gray-500 dark:text-gray-400">Data Quality</div>
						<div className="font-medium">{lead.data_quality_score}/100</div>
					</div>
					<div>
						<div className="text-sm text-gray-500 dark:text-gray-400">Technologies</div>
						<div className="font-medium">{lead.technologies?.length ? lead.technologies.join(", ") : "None"}</div>
					</div>
				</div>

				{lead.signals && lead.signals.length > 0 && (
					<div className="mb-6">
						<h2 className="mb-2 text-lg font-semibold">Buying Signals</h2>
						<div className="flex flex-wrap gap-2">
							{lead.signals.map((signal: LeadSignal) => (
								<span
									key={signal.id}
									className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
									<SignalIcons signals={[signal]} />
									{signal.type.replace("_", " ")}
								</span>
							))}
						</div>
					</div>
				)}

				{lead.contacts && lead.contacts.length > 0 && (
					<div className="mb-6">
						<h2 className="mb-2 text-lg font-semibold">Contacts</h2>
						<div className="space-y-2">
							{lead.contacts.map((contact: Contact) => (
								<div key={contact.id} className="rounded border border-gray-300 p-3 dark:border-gray-700">
									<div className="font-medium">{contact.name}</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">{contact.title}</div>
									{contact.email && (
										<a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline">
											{contact.email}
										</a>
									)}
									{contact.linkedin_url && (
										<a
											href={contact.linkedin_url}
											target="_blank"
											rel="noopener noreferrer"
											className="ml-2 text-sm text-blue-600 hover:underline">
											LinkedIn
										</a>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{lead.score_detail && (
					<div className="mb-6">
						<h2 className="mb-2 text-lg font-semibold">Score Breakdown</h2>
						<div className="grid grid-cols-2 gap-2 md:grid-cols-4">
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Industry</span>
								<div className="font-medium">{lead.score_detail.industry_score}/20</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Employees</span>
								<div className="font-medium">{lead.score_detail.employee_score}/10</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Revenue</span>
								<div className="font-medium">{lead.score_detail.revenue_score}/15</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Geography</span>
								<div className="font-medium">{lead.score_detail.geography_score}/10</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Technology</span>
								<div className="font-medium">{lead.score_detail.technology_score}/15</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Signals</span>
								<div className="font-medium">{lead.score_detail.signal_score}/15</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Persona</span>
								<div className="font-medium">{lead.score_detail.persona_score}/5</div>
							</div>
							<div className="rounded bg-gray-50 p-2 dark:bg-gray-700">
								<span className="text-sm text-gray-500 dark:text-gray-400">Data Quality</span>
								<div className="font-medium">{lead.score_detail.data_quality_score}/10</div>
							</div>
						</div>
					</div>
				)}

				{lead.score_detail?.explanation && (
					<div className="mb-6">
						<h2 className="mb-2 text-lg font-semibold">Why this lead?</h2>
						<div className="rounded border border-blue-200 bg-blue-50 p-4 text-gray-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-gray-300">
							{lead.score_detail.explanation}
						</div>
					</div>
				)}

				{lead.score_detail?.recommended_action && (
					<div>
						<h2 className="mb-2 text-lg font-semibold">Recommended Action</h2>
						<div className="rounded border border-green-200 bg-green-50 p-4 text-gray-700 dark:border-green-800 dark:bg-green-900/20 dark:text-gray-300">
							{lead.score_detail.recommended_action}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
