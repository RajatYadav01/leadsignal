interface ErrorMessageProps {
	message: string;
	retry?: () => void;
}

export const ErrorMessage = ({ message, retry }: ErrorMessageProps) => (
	<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
		<p className="font-medium">Error</p>
		<p className="text-sm">{message}</p>
		{retry && (
			<button onClick={retry} className="mt-2 text-sm underline hover:no-underline">
				Try again
			</button>
		)}
	</div>
);
