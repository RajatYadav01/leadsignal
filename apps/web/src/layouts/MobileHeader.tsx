import { Link } from "react-router";
import { Menu } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

interface MobileHeaderProps {
	onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
	return (
		<header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-700 dark:bg-gray-800">
			<button
				onClick={onMenuClick}
				className="rounded-md p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
				aria-label="Open menu">
				<Menu size={24} />
			</button>
			<Link to="/" className="text-primary dark:text-primary flex items-center gap-2 text-xl font-bold">
				<Logo />
				LeadSignal
			</Link>
			<div className="w-10" />
		</header>
	);
}
