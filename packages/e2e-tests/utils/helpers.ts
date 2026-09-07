import { Page } from "@playwright/test";

export async function createProject(page: Page, name: string, description: string) {
	await page.goto("/");
	await page.getByRole("button", { name: /New Project/i }).click();
	await page.getByPlaceholder("Project Name").fill(name);
	await page.getByPlaceholder("Description").fill(description);
	await page.getByRole("button", { name: "Create" }).click();
	// Wait for navigation to dashboard
	await page.waitForURL(/\/projects\/\d+\/dashboard/);
}

export async function uploadCSV(page: Page, filePath: string) {
	// Navigate to upload page
	await page.getByRole("link", { name: "Upload" }).click();
	// Wait for upload component
	const fileInput = page.locator('input[type="file"]');
	await fileInput.setInputFiles(filePath);
	await page.getByRole("button", { name: "Upload" }).click();
	// Wait for import summary
	await page.waitForSelector("text=Import complete", { timeout: 30000 });
}

export async function configureICP(page: Page, icpData: any) {
	await page.getByRole("link", { name: "ICP" }).click();
	// Industries
	for (const industry of icpData.industries) {
		await page.getByPlaceholder(/Industry/i).fill(industry);
		await page.getByRole("button", { name: "Add" }).click();
	}
	// Countries
	for (const country of icpData.countries) {
		await page.getByPlaceholder(/Country/i).fill(country);
		await page.getByRole("button", { name: "Add" }).click();
	}
	// Employees
	await page.fill('input[name="min_employees"]', String(icpData.min_employees));
	await page.fill('input[name="max_employees"]', String(icpData.max_employees));
	// Revenue
	await page.fill('input[name="min_revenue"]', String(icpData.min_revenue));
	await page.fill('input[name="max_revenue"]', String(icpData.max_revenue));
	// Technologies
	for (const tech of icpData.technologies) {
		await page.getByPlaceholder(/Technology/i).fill(tech);
		await page.getByRole("button", { name: "Add" }).click();
	}
	// Target titles
	for (const title of icpData.target_titles) {
		await page.getByPlaceholder(/Job Titles/i).fill(title);
		await page.getByRole("button", { name: "Add" }).click();
	}
	// Save
	await page.getByRole("button", { name: "Save ICP" }).click();
	await page.waitForSelector("text=ICP settings saved successfully");
}

export async function analyzeLeads(page: Page) {
	// Go to dashboard if not already there
	await page.getByRole("link", { name: "Dashboard" }).click();
	await page.getByRole("button", { name: "Analyze Leads" }).click();
	// Wait for analysis to complete (button becomes enabled again)
	await page.waitForSelector('button:has-text("Analyze Leads"):not([disabled])', { timeout: 60000 });
	// Wait for success message
	await page.waitForSelector("text=Analysis completed successfully", { timeout: 30000 });
}
