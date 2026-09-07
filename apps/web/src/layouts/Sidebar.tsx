import { useMemo } from "react";
import { Link, useParams, useLocation } from "react-router";
import { Sun, Moon, Home, BarChart3, Users, Settings, Upload } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Logo } from "@/components/ui/Logo";

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const { theme, toggleTheme } = useTheme();
	const { projectId } = useParams<{ projectId: string }>();
	const location = useLocation();

	const navItems = useMemo(() => {
		return [
			{ to: "/", label: "Projects", icon: Home },
			{
				to: projectId ? `/projects/${projectId}/dashboard` : "#",
				label: "Dashboard",
				icon: BarChart3,
				disabled: !projectId,
			},
			{
				to: projectId ? `/projects/${projectId}/leads` : "#",
				label: "Leads",
				icon: Users,
				disabled: !projectId,
			},
			{
				to: projectId ? `/projects/${projectId}/icp` : "#",
				label: "ICP",
				icon: Settings,
				disabled: !projectId,
			},
			{
				to: projectId ? `/projects/${projectId}/upload` : "#",
				label: "Upload",
				icon: Upload,
				disabled: !projectId,
			},
		];
	}, [projectId, location.pathname]);

	const handleLinkClick = () => {
		if (window.innerWidth < 768) {
			onClose();
		}
	};

	const isActive = (to: string) => {
		if (to === "#") return false;
		return location.pathname === to;
	};

	return (
		<>
			{isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}

			<aside
				className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out md:relative md:translate-x-0 dark:border-gray-700 dark:bg-gray-800 ${isOpen ? "translate-x-0" : "-translate-x-full"} `}>
				<div className="flex h-full flex-col">
					<div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
						<Link to="/" className="text-primary dark:text-primary flex items-center gap-2 text-2xl font-bold" onClick={handleLinkClick}>
							<Logo />
							LeadSignal
						</Link>
					</div>

					<nav className="flex-1 space-y-1 p-4">
						{navItems.map((item) => {
							const active = isActive(item.to);
							const isDisabled = item.disabled || item.to === "#";

							return (
								<Link
									key={item.label}
									to={item.to}
									onClick={handleLinkClick}
									className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
										active
											? "text-primary dark:text-primary bg-gray-100 dark:bg-gray-700"
											: "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
									} ${isDisabled ? "pointer-events-none opacity-50" : ""} `}>
									<item.icon size={20} />
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className="border-t border-gray-200 p-4 dark:border-gray-700">
						<button
							onClick={toggleTheme}
							className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
							{theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
							{theme === "light" ? "Dark Theme" : "Light Theme"}
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
