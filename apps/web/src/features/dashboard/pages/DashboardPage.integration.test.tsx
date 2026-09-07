import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/services/api";
import { DashboardPage } from "./DashboardPage";

const mock = new MockAdapter(api);

describe("DashboardPage", () => {
	it("renders loading state initially", () => {
		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/projects/1/dashboard"]}>
					<Routes>
						<Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);
		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("renders dashboard stats after fetch", async () => {
		const mockData = {
			total_leads: 100,
			valid_leads: 80,
			icp_matches: 50,
			high_priority: 20,
		};
		mock.onGet("/projects/1/dashboard/").reply(200, mockData);

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/projects/1/dashboard"]}>
					<Routes>
						<Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("Total Leads")).toBeInTheDocument();
			expect(screen.getByText("100")).toBeInTheDocument();
			expect(screen.getByText("80")).toBeInTheDocument();
		});
	});

	it("shows error message on API failure", async () => {
		mock.onGet("/projects/1/dashboard/").reply(500);

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/projects/1/dashboard"]}>
					<Routes>
						<Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Unable to fetch dashboard/)).toBeInTheDocument();
		});
	});
});
