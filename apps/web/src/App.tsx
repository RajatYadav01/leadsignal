import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { router } from "./routes";
import "@/styles/global.css";

const queryClient = new QueryClient({
	defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<RouterProvider router={router} />
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
