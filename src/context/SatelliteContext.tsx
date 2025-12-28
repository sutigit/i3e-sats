import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Satellite, TLE } from '../types';
import { coords } from '../utils/defaults';
import { useTleMockQuery } from '../queries/TleQuery';
import { getSatData } from '../utils/getSatData';
import { sortNearestSat } from '../utils/sortNearestSat';

interface SatelliteContextType {
    cesiumSatellites: Satellite[];
    timetableSatellites: Satellite[];
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
    const [cesiumSatellites, setCesiumSatellites] = useState<Satellite[]>([]);
    const [timetableSatellites, setTimetableSatellites] = useState<Satellite[]>([]);
    const [targetSatellite, setTargetSatellite] = useState<Satellite>()
    const [observer, setObserver] = useState({ lat: coords["otaniemi"].lat, lon: coords["otaniemi"].lon });
    const [satellitesReady, setSatellitesReady] = useState<boolean>(false)
    const { data: rawData, isLoading, isFetching, isError, isSuccess } = useTleMockQuery()

    // --- 1. Initial load. Should run once when rawData is ready ---
    useEffect(() => {
        if (!rawData) return;
        const now = new Date();
        const processed: Satellite[] = rawData.map((tle: TLE) => {
            const data = getSatData(tle, observer.lat, observer.lon, 0, now); // Removed 'now' arg based on previous file signature
            return { name: tle.name, tle, data };
        });
        const sorted: Satellite[] = sortNearestSat(processed, now);

        setCesiumSatellites(sorted);
        setTimetableSatellites(sorted);
        setTargetSatellite(sorted[0]);
        setSatellitesReady(isSuccess && !!sorted);
    }, [isSuccess]);

    // --- 2. Update the satellite timetable data every 30 seconds ---
    useEffect(() => {
        if (!rawData) return;

        const tick = () => {
            const now = new Date();
            const processed: Satellite[] = rawData.map((tle: TLE) => {
                const data = getSatData(tle, observer.lat, observer.lon, 0, now)
                return { name: tle.name, tle, data };
            });

            const sorted: Satellite[] = sortNearestSat(processed, now);
            setTimetableSatellites(sorted);
        };

        const intervalId = setInterval(tick, 30000);

        return () => clearInterval(intervalId);
    }, [rawData, observer]); // Re-start timer if observer changes

    return (
        <SatelliteContext.Provider value={{
            cesiumSatellites,
            timetableSatellites,
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