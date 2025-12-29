import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addSatelliteVisuals3D } from '../cesium/add';
import { useSatellites } from '../context/SatelliteContext';
import { VisibilityObjectComposition3D } from '../cesium/entities/VisibilityObjectComposition3D';

const GLOBE_ALTITUDE = 20000000.0

export default function CesiumGlobeView({ showFPS = false }: { showFPS?: boolean }) {
    const viewRef = useRef<HTMLDivElement>(null)
    const compositionRef = useRef<VisibilityObjectComposition3D>(null)
    const { cesiumGlobeRef, cesiumSatellites, targetSatellite, observer, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!viewRef.current || !cesiumSatellites) return
        cesiumGlobeRef.current = cesiumView(viewRef, { lon: observer.lon, lat: observer.lat, alt: GLOBE_ALTITUDE })

        addSatelliteVisuals3D({ satellites: cesiumSatellites, viewer: cesiumGlobeRef.current })
        addObserver({ observer, viewer: cesiumGlobeRef.current })

        // Debugging
        cesiumGlobeRef.current.scene.debugShowFramesPerSecond = showFPS;

        return () => {
            cesiumGlobeRef.current?.destroy()
        }

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    useEffect(() => {
        if (!cesiumGlobeRef.current || !targetSatellite) {
            // Cleanup if no focus
            if (compositionRef.current) {
                compositionRef.current.destroy();
                compositionRef.current = null;
            }
            return;
        }

        // Cleanup previous composition (if switching from Sat A to Sat B)
        if (compositionRef.current) {
            compositionRef.current.destroy();
        }

        // Create new composition
        // We pass observer coords to draw the fan tip
        compositionRef.current = new VisibilityObjectComposition3D(
            cesiumGlobeRef.current,
            targetSatellite,
            observer.lat,
            observer.lon
        );

        // Cleanup on unmount or dependency change
        return () => {
            if (compositionRef.current) {
                compositionRef.current.destroy();
                compositionRef.current = null;
            }
        };
    }, [targetSatellite, observer]);

    return (
        <div ref={viewRef} id='cesium-view' />
    )
}
