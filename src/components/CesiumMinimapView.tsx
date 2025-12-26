import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserverGround, addSatellitePointGround, addSatelliteTrailGround } from '../cesium/add';
import { useSatellites } from '../context/ContextAPI';
import { getMinimapViewConfig } from '../cesium/utils';
import type { Viewer } from 'cesium';

export default function CesiumMinimapView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumMinimapRef = useRef(null)
    const viewerRef = useRef<Viewer>(null)
    const { observer, targetSatellite, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!cesiumMinimapRef.current || !targetSatellite) return
        viewerRef.current = cesiumView(cesiumMinimapRef, {
            lon: targetSatellite.stat.location.lon,
            lat: targetSatellite.stat.location.lat,
            alt: 100000.0,
            minimap: true,
        })
        addObserverGround({ observer, viewer: viewerRef.current })
        addSatellitePointGround({ satellite: targetSatellite, viewer: viewerRef.current })
        addSatelliteTrailGround({ satellite: targetSatellite, viewer: viewerRef.current })

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
        const viewConfig = getMinimapViewConfig(targetSatellite.stat.location.lon, targetSatellite.stat.location.lat, 100000.0)
        viewerRef.current.camera.setView(viewConfig)
    }, [targetSatellite])

    return (
        <div id="cesium-minimap-container">
            <div id="cesium-minimap-view" ref={cesiumMinimapRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
            <div id="cesium-minimap-north-pointer">N</ div>
        </div>
    )
}
