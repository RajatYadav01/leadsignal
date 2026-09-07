import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
	createColumnHelper,
	createPaginatedRowModel,
	rowPaginationFeature,
	tableFeatures,
	useTable,
	FlexRender,
} from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { Download } from "lucide-react";
import type { LeadSignal } from "@/types";
import { fetchLeads } from "@/services/api";
import { Card } from "@/components/ui/Card";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SignalIcons } from "@/components/SignalIcons";

type LeadPriority = "HIGH" | "MEDIUM" | "LOW" | "POOR";

interface LeadContact {
	name: string;
	email: string;
}

interface Lead {
	id: string;
	company_name: string;
	industry: string;
	employees: number;
	country: string;
	contacts?: LeadContact[];
	lead_score: number;
	priority: LeadPriority;
	signals?: LeadSignal[];
}

interface FilterForm {
	score_min: number;
	score_max: number;
	industry: string;
	country: string;
	hiring: boolean;
}

const features = tableFeatures({
	rowPaginationFeature,
	paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, Lead>();

const columns = columnHelper.columns([
	columnHelper.accessor("company_name", {
		header: "Company",
	}),

	columnHelper.accessor("industry", {
		header: "Industry",
	}),

	columnHelper.accessor("employees", {
		header: "Employees",
	}),

	columnHelper.accessor("country", {
		header: "Country",
	}),

	columnHelper.accessor((row) => row.contacts?.[0]?.name ?? "", {
		id: "contact_name",
		header: "Contact",
	}),

	columnHelper.accessor((row) => row.contacts?.[0]?.email ?? "", {
		id: "contact_email",
		header: "Email",
	}),

	columnHelper.accessor("lead_score", {
		header: "Score",
		cell: ({ row }) => <ScoreBadge score={row.original.lead_score} priority={row.original.priority} />,
	}),

	columnHelper.accessor("signals", {
		header: "Signals",
		cell: ({ row }) => <SignalIcons signals={row.original.signals ?? []} />,
	}),

	columnHelper.display({
		id: "actions",
		header: "Action",
		cell: ({ row }) => (
			<Link to={`/leads/${row.original.id}`} className="text-primary hover:underline">
				View
			</Link>
		),
	}),
]);

export function LeadsPage() {
	const { projectId } = useParams<{ projectId: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const [exporting, setExporting] = useState(false);

	const { register, handleSubmit, watch } = useForm<FilterForm>({
		defaultValues: {
			score_min: Number(searchParams.get("score_min")) || 0,
			score_max: Number(searchParams.get("score_max")) || 100,
			industry: searchParams.get("industry") || "",
			country: searchParams.get("country") || "",
			hiring: searchParams.get("hiring") === "true",
		},
	});

	const filters = {
		score__gte: watch("score_min"),
		score__lte: watch("score_max"),
		industry: watch("industry"),
		country: watch("country"),
		hiring: watch("hiring"),
	};

	const { data, isLoading } = useQuery({
		queryKey: ["leads", projectId, filters],
		queryFn: () => fetchLeads(projectId!, filters),
		enabled: !!projectId,
	});

	const onSubmit = (formData: FilterForm) => {
		const params = new URLSearchParams();

		if (formData.score_min) {
			params.set("score_min", String(formData.score_min));
		}

		if (formData.score_max) {
			params.set("score_max", String(formData.score_max));
		}

		if (formData.industry) {
			params.set("industry", formData.industry);
		}

		if (formData.country) {
			params.set("country", formData.country);
		}

		if (formData.hiring) {
			params.set("hiring", "true");
		}

		setSearchParams(params);
	};

	const handleExport = async () => {
		setExporting(true);

		try {
			const params = new URLSearchParams();

			Object.entries(filters).forEach(([key, value]) => {
				if (value) {
					params.set(key, String(value));
				}
			});

			const url = `/api/v1/projects/${projectId}/leads/export/?` + params.toString();

			window.location.href = url;
		} finally {
			setExporting(false);
		}
	};

	const table = useTable({
		features,
		data: data?.results ?? [],
		columns,

		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		},
	});

	if (isLoading) {
		return <div>Loading leads...</div>;
	}

	return (
		<div>
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Leads</h1>

				<button
					onClick={handleExport}
					disabled={exporting}
					className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50">
					<Download size={18} />

					{exporting ? "Exporting..." : "Export CSV"}
				</button>
			</div>

			<Card className="mb-6">
				<form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 md:grid-cols-5">
					<div>
						<label className="text-sm text-gray-500 dark:text-gray-400">Min Score</label>

						<input
							type="number"
							{...register("score_min", {
								valueAsNumber: true,
							})}
							className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700"
						/>
					</div>

					<div>
						<label className="text-sm text-gray-500 dark:text-gray-400">Max Score</label>

						<input
							type="number"
							{...register("score_max", {
								valueAsNumber: true,
							})}
							className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700"
						/>
					</div>

					<div>
						<label className="text-sm text-gray-500 dark:text-gray-400">Industry</label>

						<input
							{...register("industry")}
							placeholder="e.g. SaaS"
							className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700"
						/>
					</div>

					<div>
						<label className="text-sm text-gray-500 dark:text-gray-400">Country</label>

						<input {...register("country")} placeholder="e.g. US" className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700" />
					</div>

					<div className="flex items-end gap-2">
						<label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
							<input type="checkbox" {...register("hiring")} />
							Hiring Only
						</label>

						<button type="submit" className="bg-primary rounded px-4 py-2 text-white">
							Filter
						</button>
					</div>
				</form>
			</Card>

			<div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
				<table className="w-full text-sm">
					<thead className="bg-gray-50 dark:bg-gray-700">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="p-3 text-left font-semibold">
										{header.isPlaceholder ? null : <FlexRender header={header} />}
									</th>
								))}
							</tr>
						))}
					</thead>

					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className="border-t border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
								{row.getAllCells().map((cell) => (
									<td key={cell.id} className="p-3">
										<FlexRender cell={cell} />
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>

				<div className="flex items-center justify-between border-t border-gray-300 p-3 dark:border-gray-700">
					<span>
						Page {table.state.pagination.pageIndex + 1} of {table.getPageCount()}
					</span>

					<div className="flex gap-2">
						<button
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50">
							Prev
						</button>

						<button
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50">
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
