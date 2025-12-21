import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from "preact/compat";
import { getData } from "./tle/iceye";

const queryClient = new QueryClient();

export const useTleQuery = () => useQuery({ queryKey: ['iceye'], queryFn: getData })

export const TleProvider = ({ debug = false, children }: { debug?: boolean, children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={debug} />
    </QueryClientProvider>
  )
}