import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Satellite, TLE } from '../types';
import { coords } from '../utils/defaults';
import { useTleMockQuery } from '../queries/TleQuery';
import { getSatStats } from '../utils/getSatStats';

interface SatelliteContextType {
    satellites: Satellite[];
    satellitesReady: boolean;
    observer: { lat: number; lon: number };
    setObserver: (coords: { lat: number; lon: number }) => void;
    targetSatellite?: Satellite;
    setTargetSatellite: (sat: Satellite) => void;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
}

const SatelliteContext = createContext<SatelliteContextType | undefined>(undefined);

export const SatelliteProvider = ({ children }: { children: React.ReactNode }) => {
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [targetSatellite, setTargetSatellite] = useState<Satellite>()
    const [observer, setObserver] = useState({ lat: coords["otaniemi"].lat, lon: coords["otaniemi"].lon });
    const [satellitesReady, setSatellitesReady] = useState<boolean>(false)
    const { data: rawData, isLoading, isFetching, isError, isSuccess } = useTleMockQuery()

    useEffect(() => {
        if (!rawData) return;
        const processed: Satellite[] = rawData.map((tle: TLE) => {
            const stats = getSatStats(tle, observer.lat, observer.lon);
            return { name: tle.name, tle, stat: stats };
        });
        setSatellites(processed);
        setTargetSatellite(processed[0])
        setSatellitesReady(isSuccess && !!processed)
    }, [rawData, observer]);

    return (
        <SatelliteContext.Provider value={{
            satellites,
            satellitesReady,
            observer,
            setObserver,
            targetSatellite,
            setTargetSatellite,
            isLoading,
            isFetching,
            isError,
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