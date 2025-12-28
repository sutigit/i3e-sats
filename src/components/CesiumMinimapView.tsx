import { useEffect, useRef, type RefObject } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addSatelliteVisuals2D, } from '../cesium/add';
import { useSatellites } from '../context/SatelliteContext';
import SatelliteTracker from '../cesium/utils/SatelliteTracker';
import { VisibilityObjectComposition2D } from '../cesium/entities/VisibilityObjectComposition2D';

const ALTITUDE = 10000.0

export default function CesiumMinimapView({ trackerRef, showFPS = false }: { trackerRef: RefObject<SatelliteTracker>, showFPS?: boolean }) {
    const viewRef = useRef<HTMLDivElement>(null)
    const compositionRef = useRef<VisibilityObjectComposition2D>(null)
    const { cesiumMinimapRef, observer, cesiumSatellites, targetSatellite, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!viewRef.current || !satellitesReady) return
        cesiumMinimapRef.current = cesiumView(viewRef, {
            lon: 0,
            lat: 0,
            alt: ALTITUDE,
            minimap: true,
        })

        addSatelliteVisuals2D({ satellites: cesiumSatellites, viewer: cesiumMinimapRef.current })
        addObserver({ observer, viewer: cesiumMinimapRef.current })

        // Debugging
        cesiumMinimapRef.current.scene.debugShowFramesPerSecond = showFPS;

        trackerRef.current = new SatelliteTracker(cesiumMinimapRef.current, ALTITUDE);
        if (targetSatellite) {
            trackerRef.current.track(targetSatellite.tle);
        }

        return (() => {
            trackerRef.current?.stop();
            cesiumMinimapRef.current?.destroy();
            cesiumMinimapRef.current = null;
            trackerRef.current = null;
        })

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    useEffect(() => {
        if (!cesiumMinimapRef.current || !targetSatellite) {
            // Cleanup if no focus
            if (compositionRef.current) {
                compositionRef.current.destroy();
                compositionRef.current = null;
            }
            return;
        }

        // 1. Cleanup previous composition (if switching from Sat A to Sat B)
        if (compositionRef.current) {
            compositionRef.current.destroy();
        }

        // 2. Create new composition
        compositionRef.current = new VisibilityObjectComposition2D(
            cesiumMinimapRef.current,
            targetSatellite,
            observer.lat,
            observer.lon
        );

        // 3. Cleanup on unmount or dependency change
        return () => {
            if (compositionRef.current) {
                compositionRef.current.destroy();
                compositionRef.current = null;
            }
        };
    }, [targetSatellite, observer]);


    return (
        <div id="cesium-minimap-view" ref={viewRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
    )
}
