import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "preact/compat";
import { getData } from "./tle/iceye";

const queryClient = new QueryClient();

export const useTleQuery = () => useQuery({ queryKey: ['iceye'], queryFn: getData })

export const TleProvider = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}