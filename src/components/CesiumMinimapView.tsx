import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addSatelliteVisuals2D, } from '../cesium/add';
import { useSatellites } from '../context/SatelliteContext';
import SatelliteTracker from '../cesium/utils/SatelliteTracker';
import type { Viewer } from 'cesium';

const ALTITUDE = 10000.0

export default function CesiumMinimapView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumMinimapRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<Viewer>(null)
    const trackerRef = useRef<SatelliteTracker>(null);
    const { observer, satellites, targetSatellite, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!cesiumMinimapRef.current || !satellitesReady) return
        viewerRef.current = cesiumView(cesiumMinimapRef, {
            lon: 0,
            lat: 0,
            alt: ALTITUDE,
            minimap: true,
        })

        addSatelliteVisuals2D({ satellites, viewer: viewerRef.current })
        addObserver({ observer, viewer: viewerRef.current })

        // Debugging
        viewerRef.current.scene.debugShowFramesPerSecond = showFPS;

        // Satellite tracking. Start tracking immediately
        trackerRef.current = new SatelliteTracker(viewerRef.current, ALTITUDE); // Try 100km range first
        if (targetSatellite) {
            trackerRef.current.track(targetSatellite.tle);
        }

        return (() => {
            trackerRef.current?.stop();
            viewerRef.current?.destroy();
            viewerRef.current = null;
            trackerRef.current = null;
        })

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    useEffect(() => {
        if (!trackerRef.current || !targetSatellite) return

        // Handles changing targets
        trackerRef.current.track(targetSatellite.tle);
    }, [targetSatellite])

    return (
        <div id="cesium-minimap-container">
            <div id="cesium-minimap-view" ref={cesiumMinimapRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
            <div id="cesium-minimap-north-pointer">N</ div>
        </div>
    )
}
