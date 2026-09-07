import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/services/api";
import { ICPSettingsPage } from "./ICPSettingsPage";

const mock = new MockAdapter(api);

describe("ICPSettingsPage", () => {
	it("loads and displays existing ICP data", async () => {
		const mockData = {
			industries: ["SaaS"],
			countries: ["US"],
			min_employees: 50,
			max_employees: 500,
			min_revenue: 5000000,
			max_revenue: 100000000,
			technologies: ["HubSpot"],
			target_titles: ["CEO"],
		};
		mock.onGet("/projects/1/icp/").reply(200, mockData);

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/projects/1/icp"]}>
					<Routes>
						<Route path="/projects/:projectId/icp" element={<ICPSettingsPage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByDisplayValue("SaaS")).toBeInTheDocument();
			expect(screen.getByDisplayValue("US")).toBeInTheDocument();
		});
	});

	it("adds a tag when Add button is clicked", async () => {
		const mockData = { industries: [], countries: [], technologies: [], target_titles: [] };
		mock.onGet("/projects/1/icp/").reply(200, mockData);
		mock.onPut("/projects/1/icp/").reply(200);

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/projects/1/icp"]}>
					<Routes>
						<Route path="/projects/:projectId/icp" element={<ICPSettingsPage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			// Find the input for industries (first TagInput)
			const inputs = screen.getAllByPlaceholderText("e.g. SaaS, Fintech");
			const input = inputs[0];
			fireEvent.change(input, { target: { value: "SaaS" } });
			fireEvent.click(screen.getByText("Add")); // Might need to target specific Add button
		});

		await waitFor(() => {
			expect(screen.getByText("SaaS")).toBeInTheDocument();
		});
	});

	// Save mutation test - similar
});
