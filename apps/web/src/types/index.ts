export interface Project {
	id: string;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
}

export interface ICPProfile {
	id?: string;
	project: string;
	industries: string[];
	countries: string[];
	min_employees: number | null;
	max_employees: number | null;
	min_revenue: number | null;
	max_revenue: number | null;
	technologies: string[];
	target_titles: string[];
}

export interface Contact {
	id: string;
	name: string;
	title: string;
	normalized_title: string;
	email: string;
	linkedin_url: string;
}

export interface LeadSignal {
	id: string;
	type: "HIRING" | "EMPLOYEE_GROWTH" | "FUNDING" | "TECHNOLOGY_MATCH";
	value: Record<string, unknown>;
	confidence: number;
}

export interface LeadScore {
	total_score: number;
	industry_score: number;
	employee_score: number;
	revenue_score: number;
	geography_score: number;
	technology_score: number;
	signal_score: number;
	persona_score: number;
	data_quality_score: number;
	explanation: string;
	recommended_action: string;
}

export interface Lead {
	id: string;
	project: string;
	company_name: string;
	normalized_company_name: string;
	website: string;
	industry: string;
	country: string;
	employees: number | null;
	revenue: number | null;
	technologies: string[];
	hiring: boolean;
	employee_growth: number | null;
	funding_date: string | null;
	data_quality_score: number;
	lead_score: number;
	priority: "HIGH" | "MEDIUM" | "LOW" | "POOR";
	created_at: string;
	contacts: Contact[];
	signals: LeadSignal[];
	score_detail: LeadScore | null;
}

export interface DashboardStats {
	total_leads: number;
	valid_leads: number;
	icp_matches: number;
	high_priority: number;
}

export interface ImportSummary {
	total_rows: number;
	valid_rows: number;
	duplicate_rows: number;
	invalid_rows: number;
	errors: string[];
}
