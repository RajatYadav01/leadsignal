import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api } from "@/services/api";
import { ProjectsPage } from "./ProjectsPage";

const mock = new MockAdapter(api);

const project = {
	id: "1",
	name: "Demo Project",
	description: "A project used to test deletion.",
	created_at: "2026-11-14T10:00:00Z",
	updated_at: "2026-11-14T10:00:00Z",
};

function renderProjectsPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter initialEntries={["/"]}>
				<Routes>
					<Route path="/" element={<ProjectsPage />} />
					<Route path="/projects/:projectId/dashboard" element={<div>Project dashboard</div>} />
				</Routes>
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

describe("ProjectsPage project deletion", () => {
	beforeEach(() => {
		mock.reset();
	});

	afterEach(() => {
		mock.reset();
	});

	it("deletes a project after explicit confirmation", async () => {
		mock.onGet("/projects/").reply(200, [project]);
		mock.onDelete("/projects/1/").reply(204);
		renderProjectsPage();

		await screen.findByText("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "Delete Demo Project" }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText(/all associated leads, contacts, signals/i)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Delete project" }));

		await waitFor(() => {
			expect(mock.history.delete).toHaveLength(1);
			expect(screen.queryByText("Demo Project")).not.toBeInTheDocument();
		});
	});

	it("keeps the project and displays an error when deletion fails", async () => {
		mock.onGet("/projects/").reply(200, [project]);
		mock.onDelete("/projects/1/").reply(500);
		renderProjectsPage();

		await screen.findByText("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "Delete Demo Project" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete project" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent("Unable to delete this project.");
		});
		expect(screen.getByText("Demo Project")).toBeInTheDocument();
	});
});

describe("ProjectsPage project editing", () => {
	beforeEach(() => {
		mock.reset();
	});

	afterEach(() => {
		mock.reset();
	});

	it("updates a project's name and description", async () => {
		const updatedProject = {
			...project,
			name: "Updated Project",
			description: "The updated project description.",
			updated_at: "2026-11-15T10:00:00Z",
		};
		mock.onGet("/projects/").reply(200, [project]);
		mock.onPatch("/projects/1/").reply(200, updatedProject);
		renderProjectsPage();

		await screen.findByText("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "Edit Demo Project" }));

		const dialog = screen.getByRole("dialog", { name: "Edit Project" });
		expect(screen.getByLabelText("Project name")).toHaveValue("Demo Project");
		expect(screen.getByLabelText("Description")).toHaveValue("A project used to test deletion.");

		fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "Updated Project" } });
		fireEvent.change(screen.getByLabelText("Description"), { target: { value: "The updated project description." } });
		fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));

		await waitFor(() => {
			expect(mock.history.patch).toHaveLength(1);
			expect(screen.getByText("Updated Project")).toBeInTheDocument();
			expect(screen.getByText("The updated project description.")).toBeInTheDocument();
		});
		expect(screen.queryByText("Demo Project")).not.toBeInTheDocument();
	});

	it("keeps the edit dialog open and displays an error when the update fails", async () => {
		mock.onGet("/projects/").reply(200, [project]);
		mock.onPatch("/projects/1/").reply(500);
		renderProjectsPage();

		await screen.findByText("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "Edit Demo Project" }));
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		await waitFor(() => {
			expect(screen.getByRole("alert")).toHaveTextContent("Unable to update this project.");
		});
		expect(screen.getByRole("dialog", { name: "Edit Project" })).toBeInTheDocument();
		expect(screen.getByText("Demo Project")).toBeInTheDocument();
	});

	it("requires a non-empty project name", async () => {
		mock.onGet("/projects/").reply(200, [project]);
		renderProjectsPage();

		await screen.findByText("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "Edit Demo Project" }));
		fireEvent.change(screen.getByLabelText("Project name"), { target: { value: "   " } });
		fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

		expect(screen.getByRole("alert")).toHaveTextContent("Project name is required.");
		expect(mock.history.patch).toHaveLength(0);
	});
});
