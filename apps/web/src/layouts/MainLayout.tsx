import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { Footer } from "./Footer";

export function MainLayout() {
	// Sidebar state: open by default on desktop, closed on mobile initially
	const [sidebarOpen, setSidebarOpen] = useState(() => {
		// Check if window is defined (for SSR safety) and screen width
		if (typeof window !== "undefined") {
			return window.innerWidth >= 768;
		}
		return true;
	});

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setSidebarOpen(true);
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const toggleSidebar = () => setSidebarOpen((prev) => !prev);

	return (
		<div className="flex min-h-full overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
			<div className="flex min-h-full min-w-0 flex-1 flex-col">
				<MobileHeader onMenuClick={toggleSidebar} />
				<main className="flex-1 overflow-y-auto p-4 md:p-6">
					<Outlet />
				</main>
				<Footer />
			</div>
		</div>
	);
}
