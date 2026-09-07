import { useRef, useState } from "react";
import { useParams } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, Upload, XCircle } from "lucide-react";
import { uploadCSV } from "@/services/api";

export function UploadCSVPage() {
	const { projectId } = useParams<{ projectId: string }>();
	const inputRef = useRef<HTMLInputElement>(null);

	const [file, setFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);
	const [fileError, setFileError] = useState("");

	const mutation = useMutation({
		mutationFn: (file: File) => uploadCSV(projectId!, file),
	});

	const validateFile = (selectedFile: File) => {
		setFileError("");

		const isCsv = selectedFile.type === "text/csv" || selectedFile.name.toLowerCase().endsWith(".csv");

		if (!isCsv) {
			setFile(null);
			setFileError("Please select a CSV file.");
			return;
		}

		const maxSize = 10 * 1024 * 1024;

		if (selectedFile.size > maxSize) {
			setFile(null);
			setFileError("File size must be less than 10 MB.");
			return;
		}

		mutation.reset();
		setFile(selectedFile);
	};

	const handleFileChange = (fileList: FileList | null) => {
		if (!fileList?.[0]) return;
		validateFile(fileList[0]);
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setDragActive(false);
		handleFileChange(event.dataTransfer.files);
	};

	const handleUpload = () => {
		if (!file || !projectId) return;
		mutation.mutate(file);
	};

	const handleRemove = () => {
		setFile(null);
		setFileError("");
		mutation.reset();

		if (inputRef.current) {
			inputRef.current.value = "";
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`;
		}

		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-8">
				<h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Import leads</h1>

				<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Upload a CSV file to import leads into this project.</p>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
				<div className="p-6 sm:p-8">
					<div
						onDragEnter={(event) => {
							event.preventDefault();
							setDragActive(true);
						}}
						onDragOver={(event) => event.preventDefault()}
						onDragLeave={(event) => {
							event.preventDefault();
							setDragActive(false);
						}}
						onDrop={handleDrop}
						onClick={() => inputRef.current?.click()}
						className={[
							"cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition sm:p-12",
							dragActive
								? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
								: "border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-gray-700/50",
						].join(" ")}>
						<input
							ref={inputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={(event) => handleFileChange(event.target.files)}
						/>

						<div className="text-primary mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400">
							<Upload size={26} />
						</div>

						<h2 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">Drop your CSV file here</h2>

						<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
							or <span className="text-primary font-medium dark:text-blue-400">browse from your computer</span>
						</p>

						<p className="mt-3 text-xs text-gray-400 dark:text-gray-500">CSV files only · Maximum size 10 MB</p>
					</div>

					{fileError && (
						<div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
							<XCircle className="mt-0.5 shrink-0" size={18} />
							<span>{fileError}</span>
						</div>
					)}

					{file && !mutation.isSuccess && (
						<div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
									<FileText size={20} />
								</div>

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>

									<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
								</div>

								<button
									type="button"
									onClick={(event) => {
										event.stopPropagation();
										handleRemove();
									}}
									disabled={mutation.isPending}
									aria-label="Remove selected file"
									className="rounded-md p-2 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-200">
									<XCircle size={18} />
								</button>
							</div>
						</div>
					)}

					{file && !mutation.isSuccess && (
						<button
							type="button"
							onClick={handleUpload}
							disabled={mutation.isPending}
							className="bg-primary mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-800">
							{mutation.isPending ? (
								<>
									<Loader2 size={18} className="animate-spin" />
									Importing leads...
								</>
							) : (
								<>
									<Upload size={18} />
									Import CSV
								</>
							)}
						</button>
					)}

					{mutation.isError && (
						<div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
							<div className="flex items-start gap-3">
								<XCircle className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" size={20} />
								<div>
									<p className="text-sm font-semibold text-red-800 dark:text-red-300">Upload failed</p>

									<p className="mt-1 text-sm text-red-700 dark:text-red-400">
										{mutation.error instanceof Error ? mutation.error.message : "Something went wrong while importing the CSV."}
									</p>
								</div>
							</div>
						</div>
					)}

					{mutation.isSuccess && (
						<div className="mt-5">
							<div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
								<div className="flex items-start gap-3">
									<CheckCircle2 className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" size={20} />

									<div>
										<p className="text-sm font-semibold text-green-800 dark:text-green-300">Import completed</p>

										<p className="mt-1 text-sm text-green-700 dark:text-green-400">Your CSV has been processed successfully.</p>
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
									<p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">Total</p>
									<p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{mutation.data.total_rows}</p>
								</div>

								<div className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
									<p className="text-xs font-medium tracking-wide text-green-600 uppercase dark:text-green-400">Valid</p>
									<p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-300">{mutation.data.valid_rows}</p>
								</div>

								<div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/20">
									<p className="text-xs font-medium tracking-wide text-yellow-600 uppercase dark:text-yellow-400">Duplicates</p>
									<p className="mt-1 text-2xl font-bold text-yellow-700 dark:text-yellow-300">{mutation.data.duplicate_rows}</p>
								</div>

								<div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
									<p className="text-xs font-medium tracking-wide text-red-600 uppercase dark:text-red-400">Invalid</p>
									<p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{mutation.data.invalid_rows}</p>
								</div>
							</div>

							<button
								type="button"
								onClick={handleRemove}
								className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
								Import another CSV
							</button>
						</div>
					)}
				</div>

				<div className="border-t border-gray-200 bg-transparent px-6 py-4 sm:px-8 dark:border-gray-700">
					<p className="text-xs text-gray-500 dark:text-gray-400">
						<strong className="font-medium text-gray-700 dark:text-gray-300">Tip:</strong> Make sure your CSV contains the required lead
						fields before uploading. Duplicate and invalid rows will be reported after processing.
					</p>
				</div>
			</div>
		</div>
	);
}
