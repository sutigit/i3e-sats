import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Satellite, TLE } from '../types';
import { coords } from '../utils/defaults';
import { useTleMockQuery } from '../queries/TleQuery';
import { getSatStats } from '../utils/getSatStats';

interface SatelliteContextType {
    satellites: Satellite[];
    focus?: Satellite;
    setFocus: (sat: Satellite) => void;
    observer: { lat: number; lon: number };
    setObserver: (coords: { lat: number; lon: number }) => void;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    isSuccess: boolean;
}

const SatelliteContext = createContext<SatelliteContextType | undefined>(undefined);

export const SatelliteProvider = ({ children }: { children: React.ReactNode }) => {
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [focus, setFocus] = useState<Satellite>()
    const [observer, setObserver] = useState({ lat: coords["otaniemi"].lat, lon: coords["otaniemi"].lon });
    const { data: rawData, isLoading, isFetching, isError, isSuccess } = useTleMockQuery()

    useEffect(() => {
        if (!rawData) return;
        const processed: Satellite[] = rawData.map((d: TLE) => {
            const stats = getSatStats(d.tle, observer.lat, observer.lon);
            return { name: d.name, tle: d.tle, stat: stats };
        });
        setSatellites(processed);
        setFocus(processed[0])
    }, [rawData, observer]);

    return (
        <SatelliteContext.Provider value={{
            satellites,
            observer,
            setObserver,
            focus,
            setFocus,
            isLoading,
            isFetching,
            isError,
            isSuccess
        }}>
            {children}
        </SatelliteContext.Provider>
    );
};

export const useSatellites = () => {
    const context = useContext(SatelliteContext);
    if (!context) {
        throw new Error('useSatellites must be used within a SatelliteProvider');
    }
    return context;
};