import { useState } from "react";
import { isAxiosError } from "axios";
import { Link, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
	const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
	const [editName, setEditName] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editError, setEditError] = useState<string | null>(null);

	const {
		data: projects,
		isLoading,
		error,
		refetch,
	} = useQuery<Project[]>({
		queryKey: ["projects"],
		queryFn: async () => {
			const response = await api.get("/projects/");
			const data = response.data;

			if (Array.isArray(data)) {
				return data;
			}

			// Support Django REST Framework's paginated response format.
			if (data && typeof data === "object" && Array.isArray(data.results)) {
				return data.results;
			}

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
			console.error("Failed to create project:", error);
		},
	});

	const updateMutation = useMutation({
		mutationFn: (data: { projectId: string; name: string; description: string }) =>
			api.patch<Project>(`/projects/${data.projectId}/`, { name: data.name, description: data.description }).then((res) => res.data),
		onSuccess: (updatedProject, variables) => {
			queryClient.setQueryData<Project[]>(["projects"], (currentProjects) =>
				(currentProjects ?? []).map((project) => (String(project.id) === variables.projectId ? updatedProject : project)),
			);
			setProjectToEdit(null);
			setEditError(null);
		},
		onError: (mutationError: unknown) => {
			const apiMessage = isAxiosError<{ detail?: string; message?: string }>(mutationError)
				? (mutationError.response?.data?.detail ?? mutationError.response?.data?.message)
				: undefined;
			const fallbackMessage = mutationError instanceof Error ? mutationError.message : "Failed to update the project. Please try again.";
			setEditError(apiMessage ?? fallbackMessage);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (projectId: string) => api.delete(`/projects/${projectId}/`),
		onSuccess: (_response, projectId) => {
			queryClient.setQueryData<Project[]>(["projects"], (currentProjects) =>
				(currentProjects ?? []).filter((project) => String(project.id) !== projectId),
			);

			// Remove cached project data, including lead details whose query keys
			// do not contain a project ID. The projects list is already up to date.
			queryClient.removeQueries({ queryKey: ["dashboard", projectId] });
			queryClient.removeQueries({ queryKey: ["leads", projectId] });
			queryClient.removeQueries({ queryKey: ["icp", projectId] });
			queryClient.removeQueries({ queryKey: ["lead"] });

			setProjectToDelete(null);
			setDeleteError(null);
		},
		onError: (mutationError: unknown) => {
			const apiMessage = isAxiosError<{ detail?: string; message?: string }>(mutationError)
				? (mutationError.response?.data?.detail ?? mutationError.response?.data?.message)
				: undefined;
			const fallbackMessage = mutationError instanceof Error ? mutationError.message : "Failed to delete the project. Please try again.";
			setDeleteError(apiMessage ?? fallbackMessage);
		},
	});

	const handleCreate = () => {
		if (!name.trim()) {
			alert("Project name is required.");
			return;
		}

		createMutation.mutate({ name: name.trim(), description: description.trim() });
	};

	const handleEdit = () => {
		if (!projectToEdit) return;

		const trimmedName = editName.trim();
		if (!trimmedName) {
			setEditError("Project name is required.");
			return;
		}

		setEditError(null);
		updateMutation.mutate({
			projectId: String(projectToEdit.id),
			name: trimmedName,
			description: editDescription.trim(),
		});
	};

	const closeEditModal = () => {
		if (updateMutation.isPending) return;

		setProjectToEdit(null);
		setEditError(null);
	};

	const handleDelete = () => {
		if (!projectToDelete) return;

		setDeleteError(null);
		deleteMutation.mutate(String(projectToDelete.id));
	};

	const closeDeleteModal = () => {
		if (deleteMutation.isPending) return;

		setProjectToDelete(null);
		setDeleteError(null);
	};

	if (isLoading) {
		return <LoadingSpinner />;
	}

	if (error) {
		const errorMessage = error instanceof Error ? error.message : "Failed to load projects.";
		return <ErrorMessage message={`Unable to load your projects. ${errorMessage}`} retry={() => refetch()} />;
	}

	const projectList = projects ?? [];

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Your Projects</h1>
				<button
					type="button"
					onClick={() => setShowModal(true)}
					className="bg-primary flex items-center gap-2 rounded-lg px-4 py-2 text-white hover:bg-blue-700">
					<Plus size={18} /> New Project
				</button>
			</div>

			{projectList.length === 0 ? (
				<div className="rounded-lg bg-white py-12 text-center shadow dark:bg-gray-800">
					<p className="text-gray-500 dark:text-gray-400">You don&apos;t have any projects yet.</p>
					<p className="text-sm text-gray-400 dark:text-gray-500">Click &quot;New Project&quot; to get started.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{projectList.map((project) => (
						<Card key={project.id} className="transition hover:shadow-md">
							<div className="flex items-start justify-between gap-3">
								<Link
									to={`/projects/${project.id}/dashboard`}
									className="min-w-0 flex-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
									<h3 className="text-lg font-semibold">{project.name}</h3>
									<p className="text-sm text-gray-500 dark:text-gray-400">{project.description || "No description"}</p>
									<p className="mt-2 text-xs text-gray-400">Created: {new Date(project.created_at).toLocaleDateString()}</p>
								</Link>
								<button
									type="button"
									aria-label={`Edit ${project.name}`}
									title={`Edit ${project.name}`}
									onClick={() => {
										setEditName(project.name);
										setEditDescription(project.description ?? "");
										setEditError(null);
										setProjectToEdit(project);
									}}
									className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
									<Pencil size={16} aria-hidden="true" />
									<span className="sr-only">Edit</span>
								</button>
								<button
									type="button"
									aria-label={`Delete ${project.name}`}
									title={`Delete ${project.name}`}
									onClick={() => {
										setDeleteError(null);
										setProjectToDelete(project);
									}}
									className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 px-2 py-1.5 text-sm text-red-600 transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40">
									<Trash2 size={16} aria-hidden="true" />
									<span className="sr-only">Delete</span>
								</button>
							</div>
						</Card>
					))}
				</div>
			)}

			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
						<h2 className="mb-4 text-center text-xl font-bold">Create Project</h2>
						<input
							className="mb-3 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Project Name"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
						<textarea
							className="mb-4 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Description"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<button type="button" className="rounded border px-4 py-2" onClick={() => setShowModal(false)}>
								Cancel
							</button>
							<button
								type="button"
								className="bg-primary rounded px-4 py-2 text-white"
								onClick={handleCreate}
								disabled={createMutation.isPending}>
								{createMutation.isPending ? "Creating..." : "Create"}
							</button>
						</div>
					</div>
				</div>
			)}

			{projectToEdit && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<form
						role="dialog"
						aria-modal="true"
						aria-labelledby="edit-project-title"
						onSubmit={(event) => {
							event.preventDefault();
							handleEdit();
						}}
						className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
						<h2 id="edit-project-title" className="mb-4 text-center text-xl font-bold">
							Edit Project
						</h2>
						<label htmlFor="edit-project-name" className="mb-1 block text-sm font-medium">
							Project name
						</label>
						<input
							id="edit-project-name"
							className="mb-3 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Project Name"
							maxLength={255}
							required
							value={editName}
							onChange={(event) => setEditName(event.target.value)}
							disabled={updateMutation.isPending}
						/>
						<label htmlFor="edit-project-description" className="mb-1 block text-sm font-medium">
							Description
						</label>
						<textarea
							id="edit-project-description"
							className="mb-4 w-full rounded border p-2 dark:border-gray-600 dark:bg-gray-700"
							placeholder="Description"
							rows={4}
							value={editDescription}
							onChange={(event) => setEditDescription(event.target.value)}
							disabled={updateMutation.isPending}
						/>
						{editError && (
							<p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
								Unable to update this project. {editError}
							</p>
						)}
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
								onClick={closeEditModal}
								disabled={updateMutation.isPending}>
								Cancel
							</button>
							<button
								type="submit"
								className="bg-primary rounded px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
								disabled={updateMutation.isPending}>
								{updateMutation.isPending ? "Saving..." : "Save changes"}
							</button>
						</div>
					</form>
				</div>
			)}

			{projectToDelete && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div
						role="dialog"
						aria-modal="true"
						aria-labelledby="delete-project-title"
						aria-describedby="delete-project-description"
						className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
						<h2 id="delete-project-title" className="mb-3 text-xl font-bold">
							Are you sure you want to delete this project?
						</h2>
						<p id="delete-project-description" className="mb-4 text-sm text-gray-600 dark:text-gray-300">
							Are you sure you want to permanently delete <strong>{projectToDelete.name}</strong>? All associated leads, contacts, signals,
							lead scores, import history, and ICP settings will also be deleted. This action cannot be undone.
						</p>
						{deleteError && (
							<p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
								Unable to delete this project. {deleteError}
							</p>
						)}
						<div className="flex justify-end gap-2">
							<button
								type="button"
								className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
								onClick={closeDeleteModal}
								disabled={deleteMutation.isPending}>
								Cancel
							</button>
							<button
								type="button"
								className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
								onClick={handleDelete}
								disabled={deleteMutation.isPending}>
								{deleteMutation.isPending ? "Deleting..." : "Delete project"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
