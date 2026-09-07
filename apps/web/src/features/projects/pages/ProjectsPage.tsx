import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { Project } from "@/types";
import { api } from "@/services/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Card } from "@/components/ui/Card";

export function ProjectsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [showModal, setShowModal] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const {
		data: projects,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["projects"],
		queryFn: async () => {
			const response = await api.get("/projects/");
			// Ensure we always return an array
			const data = response.data;
			if (Array.isArray(data)) {
				return data;
			}
			// If the API returns an object with a 'results' key (DRF pagination), extract it
			if (data && typeof data === "object" && Array.isArray(data.results)) {
				return data.results;
			}
			// Otherwise, return an empty array to avoid .map errors
			console.warn("Unexpected projects data format:", data);
			return [];
		},
		retry: 1,
	});

	const createMutation = useMutation({
		mutationFn: (data: { name: string; description: string }) => api.post("/projects/", data).then((res) => res.data),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			setShowModal(false);
			navigate(`/projects/${data.id}/dashboard`);
		},
		onError: (error) => {
			// You can show a toast notification here
			console.error("Failed to create project:", error);
		},
	});

	const handleCreate = () => {
		if (!name.trim()) {
			alert("Project name is required.");
			return;
		}
		createMutation.mutate({ name, description });
	};

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		const errorMessage = error instanceof Error ? error.message : "Failed to load projects.";
		return <ErrorMessage message={`Unable to load your projects. ${errorMessage}`} retry={() => refetch()} />;
	}

	const projectList = projects || [];

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Your Projects</h1>
				<button
					onClick={() => setShowModal(true)}
					className="bg-primary flex items-center gap-2 rounded-lg px-4 py-2 text-white hover:bg-blue-700">
					<Plus size={18} /> New Project
				</button>
			</div>

			{projectList.length === 0 ? (
				<div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
					<p className="text-gray-500 dark:text-gray-400">You don't have any projects yet.</p>
					<p className="text-sm text-gray-400 dark:text-gray-500">Click "New Project" to get started.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{projectList.map((project: Project) => (
						<Card
							key={project.id}
							className="cursor-pointer transition hover:shadow-md"
							onClick={() => navigate(`/projects/${project.id}/dashboard`)}>
							<h3 className="text-lg font-semibold">{project.name}</h3>
							<p className="text-sm text-gray-500 dark:text-gray-400">{project.description || "No description"}</p>
							<p className="mt-2 text-xs text-gray-400">Created: {new Date(project.created_at).toLocaleDateString()}</p>
						</Card>
					))}
				</div>
			)}

			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
					<div className="w-96 rounded-lg bg-white p-6 dark:bg-gray-800">
						<h2 className="mb-4 text-center text-xl font-bold">Create Project</h2>
						<input
							className="mb-3 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Project Name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
						<textarea
							className="mb-4 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<button className="rounded border px-4 py-2" onClick={() => setShowModal(false)}>
								Cancel
							</button>
							<button className="bg-primary rounded px-4 py-2 text-white" onClick={handleCreate}>
								Create
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
