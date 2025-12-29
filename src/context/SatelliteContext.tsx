import React, { createContext, useContext, useState, useEffect, useRef, type RefObject } from 'react';
import type { Satellite, TLE } from '../types';
import { coords } from '../utils/defaults';
import { useTleMockQuery } from '../queries/TleQuery';
import { getSatVisibilityData } from '../utils/getSatVisibilityData';
import { sortNearestSat } from '../utils/sortNearestSat';
import { Viewer } from 'cesium';

interface SatelliteContextType {
    cesiumGlobeRef: RefObject<Viewer>;
    cesiumMinimapRef: RefObject<Viewer>;
    cesiumSatellites: Satellite[];
    timetableSatellites: Satellite[];
    satellitesReady: boolean;
    observer: { lat: number; lon: number };
    setObserver: (coords: { lat: number; lon: number }) => void;
    targetSatellite?: Satellite;
    setTargetSatellite: (sat: Satellite) => void;
    mobileOpenMinimap: boolean,
    setMobileOpenMinimap: (open: boolean) => void;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
}

const SatelliteContext = createContext<SatelliteContextType | undefined>(undefined);

export const SatelliteProvider = ({ children }: { children: React.ReactNode }) => {
    // network
    const { data, isLoading, isFetching, isError, isSuccess } = useTleMockQuery()

    // cesium refs
    const cesiumGlobeRef = useRef<Viewer>(null)
    const cesiumMinimapRef = useRef<Viewer>(null)

    // data
    const [cesiumSatellites, setCesiumSatellites] = useState<Satellite[]>([]);
    const [timetableSatellites, setTimetableSatellites] = useState<Satellite[]>([]);
    const [targetSatellite, setTargetSatellite] = useState<Satellite>()
    const [observer, setObserver] = useState({ lat: coords["otaniemi"].lat, lon: coords["otaniemi"].lon });
    const [satellitesReady, setSatellitesReady] = useState<boolean>(false)

    // layout
    const [mobileOpenMinimap, setMobileOpenMinimap] = useState<boolean>(false)

    // --- 1. Initial load. Should run once when data is ready ---
    useEffect(() => {
        if (!data) return;
        const now = new Date();
        const processed: Satellite[] = data.map((tle: TLE) => {
            const visibility = getSatVisibilityData(tle, observer.lat, observer.lon, 0, now); // Removed 'now' arg based on previous file signature
            return { name: tle.name, tle, visibility };
        });
        const sorted: Satellite[] = sortNearestSat(processed, now);

        setCesiumSatellites(sorted);
        setTimetableSatellites(sorted);
        setTargetSatellite(sorted[0]);
        setSatellitesReady(isSuccess && !!sorted);
    }, [isSuccess]);

    // --- 2. Update the satellite timetable data every 10 seconds ---
    useEffect(() => {
        if (!data) return;

        const tick = () => {
            const now = new Date();
            const processed: Satellite[] = data.map((tle: TLE) => {
                const visibility = getSatVisibilityData(tle, observer.lat, observer.lon, 0, now)
                return { name: tle.name, tle, visibility };
            });

            const sorted: Satellite[] = sortNearestSat(processed, now);
            setTimetableSatellites(sorted);
        };

        const intervalId = setInterval(tick, 10000);

        return () => clearInterval(intervalId);
    }, [data, observer]); // Re-start timer if observer changes

    return (
        <SatelliteContext.Provider value={{
            cesiumGlobeRef,
            cesiumMinimapRef,
            cesiumSatellites,
            timetableSatellites,
            satellitesReady,
            observer,
            setObserver,
            targetSatellite,
            setTargetSatellite,
            mobileOpenMinimap,
            setMobileOpenMinimap,
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