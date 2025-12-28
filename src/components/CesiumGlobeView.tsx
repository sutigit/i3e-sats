import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addSatelliteVisuals3D } from '../cesium/add';
import { useSatellites } from '../context/SatelliteContext';
import type { Viewer } from 'cesium';
import { VisibilityObjectComposition3D } from '../cesium/entities/VisibilityObjectComposition3D';

export default function CesiumGlobeView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumGlobeRef = useRef<HTMLDivElement>(null)
    const viewerRef = useRef<Viewer>(null)
    const compositionRef = useRef<VisibilityObjectComposition3D>(null)
    const { cesiumSatellites, targetSatellite, observer, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!cesiumGlobeRef.current || !cesiumSatellites) return
        const { lon, lat } = observer
        viewerRef.current = cesiumView(cesiumGlobeRef, { lon, lat, alt: 20000000.0 })

        addSatelliteVisuals3D({ satellites: cesiumSatellites, viewer: viewerRef.current })
        addObserver({ observer, viewer: viewerRef.current })

        // Debugging
        viewerRef.current.scene.debugShowFramesPerSecond = showFPS;

        return () => {
            viewerRef.current?.destroy()
        }

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    useEffect(() => {
        if (!viewerRef.current || !targetSatellite) {
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
        // We pass observer coords to draw the fan tip
        compositionRef.current = new VisibilityObjectComposition3D(
            viewerRef.current,
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
        <div ref={cesiumGlobeRef} id='cesium-view' />
    )
}
