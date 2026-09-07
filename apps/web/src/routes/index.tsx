import { createBrowserRouter } from "react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { ProjectsPage } from "@/features/projects/pages/ProjectsPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { LeadsPage } from "@/features/leads/pages/LeadsPage";
import { LeadDetailPage } from "@/features/leads/pages/LeadDetailPage";
import { ICPSettingsPage } from "@/features/icp/pages/ICPSettingsPage";
import { UploadCSVPage } from "@/features/leads/pages/UploadCSVPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter(
	[
		{
			path: "/",
			element: <MainLayout />,
			children: [
				{ index: true, element: <ProjectsPage /> },
				{ path: "projects/:projectId/dashboard", element: <DashboardPage /> },
				{ path: "projects/:projectId/leads", element: <LeadsPage /> },
				{ path: "leads/:leadId", element: <LeadDetailPage /> },
				{ path: "projects/:projectId/icp", element: <ICPSettingsPage /> },
				{ path: "projects/:projectId/upload", element: <UploadCSVPage /> },
				{ path: "*", element: <NotFoundPage /> },
			],
		},
	],
	{
		basename: import.meta.env.VITE_BASE_URL || "/",
	},
);
