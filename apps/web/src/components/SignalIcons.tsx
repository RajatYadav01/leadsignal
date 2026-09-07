import React from "react";
import { Rocket, TrendingUp, DollarSign, Cpu } from "lucide-react";
import type { LeadSignal } from "@/types";

const signalIcons = {
	HIRING: Rocket,
	EMPLOYEE_GROWTH: TrendingUp,
	FUNDING: DollarSign,
	TECHNOLOGY_MATCH: Cpu,
};

export const SignalIcons: React.FC<{ signals: LeadSignal[] }> = ({ signals }) => (
	<div className="flex gap-1">
		{signals.map((s) => {
			const Icon = signalIcons[s.type] || null;
			return Icon ? <Icon key={s.id} size={16} className="text-blue-500" /> : null;
		})}
	</div>
);
