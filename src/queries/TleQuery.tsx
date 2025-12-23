import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from "preact/compat";
import { getIceyeData, getIceyeMockData } from "./tle/iceye";

const queryClient = new QueryClient();

export const useTleQuery = () => useQuery({ queryKey: ['iceye'], queryFn: getIceyeData })
export const useTleMockQuery = () => useQuery({ queryKey: ['iceye_mock'], queryFn: getIceyeMockData })

type TleProviderProps = {
  /**
   * Turns on the react-query dev tool on initial open
   */
  devTools?: boolean,

  children?: ReactNode
}

export const TleProvider = ({ devTools = false, children }: TleProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={devTools} />
    </QueryClientProvider>
  )
}