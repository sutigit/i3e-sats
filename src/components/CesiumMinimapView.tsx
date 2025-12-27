import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver } from '../cesium/add';
import { useSatellites } from '../context/ContextAPI';
import { getMinimapViewConfig } from '../cesium/utils';
import type { Viewer } from 'cesium';

export default function CesiumMinimapView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumMinimapRef = useRef(null)
    const viewerRef = useRef<Viewer>(null)
    const { observer, satellites, targetSatellite, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!cesiumMinimapRef.current || !targetSatellite) return
        viewerRef.current = cesiumView(cesiumMinimapRef, {
            lon: targetSatellite.data.location.lon,
            lat: targetSatellite.data.location.lat,
            alt: 100000.0,
            minimap: true,
        })
        addObserver({ observer, viewer: viewerRef.current })

        // Debugging
        viewerRef.current.scene.debugShowFramesPerSecond = showFPS;

        return (() => {
            viewerRef.current?.destroy()
        })

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    useEffect(() => {
        // Teleport to new view on target satellite change
        if (!viewerRef.current || !targetSatellite) return
        const viewConfig = getMinimapViewConfig(targetSatellite.data.location.lon, targetSatellite.data.location.lat, 100000.0)
        viewerRef.current.camera.setView(viewConfig)
    }, [targetSatellite])

    return (
        <div id="cesium-minimap-container">
            <div id="cesium-minimap-view" ref={cesiumMinimapRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
            <div id="cesium-minimap-north-pointer">N</ div>
        </div>
    )
}
