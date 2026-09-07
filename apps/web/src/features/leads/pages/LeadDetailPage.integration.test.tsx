import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import MockAdapter from "axios-mock-adapter";
import { api } from "@/services/api";
import { LeadDetailPage } from "./LeadDetailPage";

const mock = new MockAdapter(api);

describe("LeadDetailPage", () => {
	it("renders lead details", async () => {
		const mockLead = {
			id: 1,
			company_name: "Acme",
			website: "acme.com",
			industry: "SaaS",
			employees: 150,
			revenue: 25000000,
			country: "US",
			lead_score: 85,
			priority: "HIGH",
			data_quality_score: 90,
			technologies: ["HubSpot", "Salesforce"],
			contacts: [{ name: "John Smith", title: "VP Sales", email: "john@acme.com" }],
			signals: [{ type: "HIRING" }],
			score_detail: {
				total_score: 85,
				industry_score: 20,
				employee_score: 10,
				revenue_score: 15,
				geography_score: 10,
				technology_score: 15,
				signal_score: 12,
				persona_score: 5,
				data_quality_score: 8,
				explanation: "Great fit",
				recommended_action: "Contact VP Sales",
			},
		};
		mock.onGet("/leads/1/").reply(200, mockLead);

		const queryClient = new QueryClient();
		render(
			<QueryClientProvider client={queryClient}>
				<MemoryRouter initialEntries={["/leads/1"]}>
					<Routes>
						<Route path="/leads/:leadId" element={<LeadDetailPage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);

		await waitFor(() => {
			expect(screen.getByText("Acme")).toBeInTheDocument();
			expect(screen.getByText("Great fit")).toBeInTheDocument();
			expect(screen.getByText("Contact VP Sales")).toBeInTheDocument();
			expect(screen.getByText("John Smith")).toBeInTheDocument();
		});
	});
});
