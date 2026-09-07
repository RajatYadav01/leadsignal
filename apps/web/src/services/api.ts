import axios from "axios";
import type { DashboardStats } from "@/types";

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: { "Content-Type": "application/json" },
});

export const fetchDashboard = async (projectId: string): Promise<DashboardStats> => {
	const response = await api.get(`/projects/${projectId}/dashboard/`);
	return response.data;
};

export const fetchLeads = (projectId: string, params: any) => api.get(`/projects/${projectId}/leads/`, { params }).then((res) => res.data);

export const uploadCSV = (projectId: string, file: File) => {
	const formData = new FormData();
	formData.append("file", file);
	return api
		.post(`/projects/${projectId}/leads/import/`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		})
		.then((res) => res.data);
};

export const updateICP = (projectId: string, data: any) => api.put(`/projects/${projectId}/icp/`, data).then((res) => res.data);
