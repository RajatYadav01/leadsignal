import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/Card";

const icpSchema = z.object({
	industries: z.array(z.string()).min(1, "At least one industry is required"),
	countries: z.array(z.string()).min(1, "At least one country is required"),
	min_employees: z.number().nullable(),
	max_employees: z.number().nullable(),
	min_revenue: z.number().nullable(),
	max_revenue: z.number().nullable(),
	technologies: z.array(z.string()).default([]),
	target_titles: z.array(z.string()).default([]),
});

type ICPFormInput = z.input<typeof icpSchema>;

type ICPFormData = z.output<typeof icpSchema>;

interface TagInputProps {
	label: string;
	fieldName: "industries" | "countries" | "technologies" | "target_titles";
	values: string[];
	placeholder: string;
	color?: string;
	form: ReturnType<typeof useForm<ICPFormInput, unknown, ICPFormData>>;
	required?: boolean;
}

function TagInput({ label, fieldName, values, placeholder, color = "blue", form, required = false }: TagInputProps) {
	const [inputValue, setInputValue] = useState("");

	const addTag = () => {
		const trimmed = inputValue.trim();
		if (!trimmed) return;

		const current = form.getValues(fieldName) || [];

		if (!current.includes(trimmed)) {
			form.setValue(fieldName, [...current, trimmed]);
		}

		setInputValue("");
	};

	const removeTag = (index: number) => {
		const current = form.getValues(fieldName) || [];
		const newValue = [...current];

		newValue.splice(index, 1);
		form.setValue(fieldName, newValue);
	};

	const colorMap: Record<string, string> = {
		blue: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
		purple: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
		green: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
		yellow: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
	};

	return (
		<Card>
			<CardContent>
				<label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					{label} {required && <span className="text-red-500">*</span>}
				</label>

				<div className="mb-2 flex flex-wrap gap-2">
					{values.map((val, idx) => (
						<span key={idx} className={`${colorMap[color] || colorMap.blue} flex items-center gap-1 rounded px-2 py-1 text-sm`}>
							{val}
							<button type="button" onClick={() => removeTag(idx)} className="hover:text-red-600">
								<X size={14} />
							</button>
						</span>
					))}
				</div>

				<div className="flex gap-2">
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder={placeholder}
						className="flex-1 rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
					/>

					<button
						type="button"
						onClick={addTag}
						className="rounded bg-gray-100 px-3 py-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
						Add
					</button>
				</div>

				{form.formState.errors[fieldName] && <p className="mt-1 text-sm text-red-500">{form.formState.errors[fieldName]?.message}</p>}
			</CardContent>
		</Card>
	);
}

export function ICPSettingsPage() {
	const { projectId } = useParams();
	const queryClient = useQueryClient();

	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const {
		data: icpData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["icp", projectId],
		queryFn: () => api.get(`/projects/${projectId}/icp/`).then((res) => res.data),
		enabled: !!projectId,
		retry: 1,
	});

	const form = useForm<ICPFormInput, unknown, ICPFormData>({
		resolver: zodResolver(icpSchema),
		defaultValues: {
			industries: [],
			countries: [],
			min_employees: null,
			max_employees: null,
			min_revenue: null,
			max_revenue: null,
			technologies: [],
			target_titles: [],
		},
	});

	useEffect(() => {
		if (icpData) {
			form.reset({
				industries: icpData.industries || [],
				countries: icpData.countries || [],
				min_employees: icpData.min_employees ?? null,
				max_employees: icpData.max_employees ?? null,
				min_revenue: icpData.min_revenue ?? null,
				max_revenue: icpData.max_revenue ?? null,
				technologies: icpData.technologies || [],
				target_titles: icpData.target_titles || [],
			});
		}
	}, [icpData, form]);

	const saveMutation = useMutation({
		mutationFn: (data: ICPFormData) => api.put(`/projects/${projectId}/icp/`, data).then((res) => res.data),

		onSuccess: () => {
			setMessage({
				type: "success",
				text: "ICP settings saved successfully!",
			});

			queryClient.invalidateQueries({
				queryKey: ["icp", projectId],
			});

			setTimeout(() => setMessage(null), 5000);
		},

		onError: (error: any) => {
			const errorMsg = error?.response?.data?.detail || error?.message || "Failed to save ICP settings.";

			setMessage({
				type: "error",
				text: errorMsg,
			});

			setTimeout(() => setMessage(null), 5000);
		},
	});

	const onSubmit: SubmitHandler<ICPFormData> = (data) => {
		setMessage(null);
		saveMutation.mutate(data);
	};

	const industries = form.watch("industries");
	const countries = form.watch("countries");
	const technologies = form.watch("technologies") ?? []; 
    const targetTitles = form.watch("target_titles") ?? [];

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
				<p className="font-medium">Failed to load ICP settings</p>
				<p className="text-sm">{error instanceof Error ? error.message : "Please try again."}</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl p-6">
			<h1 className="mb-6 text-2xl font-bold">Ideal Customer Profile (ICP)</h1>

			<p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
				Define your target customer criteria. Leads matching these criteria will be prioritized.
			</p>

			{message && (
				<div
					className={`mb-4 rounded-lg p-3 ${
						message.type === "success"
							? "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
							: "border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
					}`}>
					{message.text}
				</div>
			)}

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<TagInput
					label="Target Industries"
					fieldName="industries"
					values={industries}
					placeholder="e.g. SaaS, Fintech"
					color="blue"
					form={form}
					required
				/>

				<TagInput
					label="Target Countries"
					fieldName="countries"
					values={countries}
					placeholder="e.g. US, UK, CA"
					color="blue"
					form={form}
					required
				/>

				<Card>
					<CardContent>
						<label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Employee Range</label>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-xs text-gray-500 dark:text-gray-400">Min</label>

								<input
									type="number"
									{...form.register("min_employees", {
										setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
									})}
									className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
									placeholder="e.g. 50"
								/>
							</div>

							<div>
								<label className="text-xs text-gray-500 dark:text-gray-400">Max</label>

								<input
									type="number"
									{...form.register("max_employees", {
										setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
									})}
									className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
									placeholder="e.g. 500"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Revenue Range (USD)</label>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-xs text-gray-500 dark:text-gray-400">Min</label>

								<input
									type="number"
									{...form.register("min_revenue", {
										setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
									})}
									className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
									placeholder="e.g. 5000000"
								/>
							</div>

							<div>
								<label className="text-xs text-gray-500 dark:text-gray-400">Max</label>

								<input
									type="number"
									{...form.register("max_revenue", {
										setValueAs: (v) => (v === "" || v === undefined ? null : Number(v)),
									})}
									className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700"
									placeholder="e.g. 100000000"
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<TagInput
					label="Technologies (optional)"
					fieldName="technologies"
					values={technologies}
					placeholder="e.g. HubSpot, Salesforce"
					color="purple"
					form={form}
				/>

				<TagInput
					label="Target Job Titles (optional)"
					fieldName="target_titles"
					values={targetTitles}
					placeholder="e.g. CEO, VP Sales"
					color="green"
					form={form}
				/>

				<div className="flex justify-end">
					<button
						type="submit"
						disabled={saveMutation.isPending}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300">
						{saveMutation.isPending ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Save ICP"
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
