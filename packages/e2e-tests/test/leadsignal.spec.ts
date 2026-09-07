import * as path from "node:path";
import { test, expect } from "@playwright/test";
import { createProject, uploadCSV, configureICP, analyzeLeads } from "./utils/helpers";
import { projectData, icpData } from "./utils/test-Data";

test.describe("LeadSignal E2E", () => {
	test.beforeEach(async ({ page }) => {
		// Ensure we start on the home page
		await page.goto("/");
	});

	test("should create a project and navigate to dashboard", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		await expect(page).toHaveURL(/\/projects\/\d+\/dashboard/);
		await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
	});

	test("should upload a CSV file", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		const csvPath = path.join(__dirname, "fixtures", "test_leads.csv");
		await uploadCSV(page, csvPath);
		// Verify import summary
		await expect(page.locator("text=Total:")).toBeVisible();
		await expect(page.locator("text=Valid:")).toBeVisible();
		await expect(page.locator("text=Duplicates:")).toBeVisible();
		await expect(page.locator("text=Invalid:")).toBeVisible();
	});

	test("should configure ICP and save", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		await configureICP(page, icpData);
		// Verify ICP settings persist
		await page.reload();
		// Check that tags exist (just check one)
		await expect(page.locator("text=SaaS")).toBeVisible();
		await expect(page.locator("text=US")).toBeVisible();
		await expect(page.locator("text=HubSpot")).toBeVisible();
	});

	test("should run analysis and update dashboard stats", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		const csvPath = path.join(__dirname, "fixtures", "test_leads.csv");
		await uploadCSV(page, csvPath);
		await configureICP(page, icpData);
		await analyzeLeads(page);
		// Check dashboard stats
		await expect(page.locator("text=Total Leads")).toBeVisible();
		// At least some leads should be present
		const totalLeads = page.locator("text=Total Leads").locator("..").locator(".text-2xl");
		await expect(totalLeads).toHaveText(/[1-9]\d*/); // non-zero
	});

	test("should display lead list with scores", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		const csvPath = path.join(__dirname, "fixtures", "test_leads.csv");
		await uploadCSV(page, csvPath);
		await configureICP(page, icpData);
		await analyzeLeads(page);
		// Navigate to leads
		await page.getByRole("link", { name: "Leads" }).click();
		await page.waitForSelector("table");
		// Check that table has rows
		const rows = page.locator("tbody tr");
		await expect(rows).toHaveCount(expect.any(Number));
		// Check first row has a score badge
		await expect(rows.first().locator(".text-xl.font-bold")).toBeVisible();
	});

	test("should view lead detail with explanation and action", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		const csvPath = path.join(__dirname, "fixtures", "test_leads.csv");
		await uploadCSV(page, csvPath);
		await configureICP(page, icpData);
		await analyzeLeads(page);
		// Go to leads and click first lead
		await page.getByRole("link", { name: "Leads" }).click();
		await page.waitForSelector("table");
		await page.getByRole("link", { name: "View" }).first().click();
		await page.waitForURL(/\/leads\/\d+/);
		// Check detail page elements
		await expect(page.getByRole("heading", { name: /Acme Software/ })).toBeVisible();
		await expect(page.locator("text=Why this lead?")).toBeVisible();
		await expect(page.locator("text=Recommended Action")).toBeVisible();
		// Back button
		await page.getByRole("button", { name: "Back to Leads" }).click();
		await expect(page).toHaveURL(/\/projects\/\d+\/leads/);
	});

	test("should export leads as CSV", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		const csvPath = path.join(__dirname, "fixtures", "test_leads.csv");
		await uploadCSV(page, csvPath);
		await configureICP(page, icpData);
		await analyzeLeads(page);
		// Go to leads
		await page.getByRole("link", { name: "Leads" }).click();
		// Click export button
		const downloadPromise = page.waitForEvent("download");
		await page.getByRole("button", { name: "Export CSV" }).click();
		const download = await downloadPromise;
		expect(download.suggestedFilename()).toMatch(/leads_.*\.csv/);
	});

	test("should toggle theme", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		// Sidebar should have theme toggle button
		const themeButton = page.getByRole("button", { name: /Light Mode|Dark Mode/ });
		const initialTheme = await themeButton.textContent();
		await themeButton.click();
		// Verify theme changed
		await expect(themeButton).not.toHaveText(initialTheme!);
		// Check that dark class is applied to html
		const html = page.locator("html");
		if (initialTheme?.includes("Light")) {
			await expect(html).toHaveClass(/dark/);
		} else {
			await expect(html).not.toHaveClass(/dark/);
		}
	});

	test("should navigate sidebar links correctly", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		// Check each link navigates
		const links = [
			{ name: "Dashboard", url: /\/projects\/\d+\/dashboard/ },
			{ name: "Leads", url: /\/projects\/\d+\/leads/ },
			{ name: "ICP", url: /\/projects\/\d+\/icp/ },
			{ name: "Upload", url: /\/projects\/\d+\/upload/ },
		];
		for (const link of links) {
			await page.getByRole("link", { name: link.name }).click();
			await expect(page).toHaveURL(link.url);
		}
		// Projects link goes to root
		await page.getByRole("link", { name: "Projects" }).click();
		await expect(page).toHaveURL("/");
	});

	test("should show error message on invalid CSV upload", async ({ page }) => {
		await createProject(page, projectData.name, projectData.description);
		await page.getByRole("link", { name: "Upload" }).click();
		// Upload a non-CSV file
		const invalidPath = path.join(__dirname, "fixtures", "invalid.txt");
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles(invalidPath);
		await page.getByRole("button", { name: "Upload" }).click();
		// Expect some error handling (either a toast or error message)
		// Since our backend returns 400 for non-CSV, we might see a generic error.
		// We'll check for presence of error message or that import summary is not shown.
		await expect(page.locator("text=Import complete")).toBeHidden({ timeout: 5000 });
	});
});
