import { Link } from "react-router";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

export function NotFoundPage() {
	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			<div className="mb-6 rounded-full bg-gray-100 p-6">
				<FileQuestion className="h-16 w-16 text-gray-400" />
			</div>
			<h1 className="mb-2 text-4xl font-bold text-gray-900">404</h1>
			<h2 className="mb-4 text-2xl font-semibold text-gray-700">Page Not Found</h2>
			<p className="mb-8 max-w-md text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
			<div className="flex gap-4">
				<Link to="/">
					<button className="gap-2">
						<Home className="h-4 w-4" />
						Home
					</button>
				</Link>
				<button onClick={() => window.history.back()} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Go Back
				</button>
			</div>
		</div>
	);
}
