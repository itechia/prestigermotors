import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 2,
			retryDelay: (attempt) => Math.min(800 * Math.pow(2, attempt), 6000),
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		},
	},
});