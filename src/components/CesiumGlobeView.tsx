import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addSatelliteVisuals3D } from '../cesium/add';
import { useSatellites } from '../context/SatelliteContext';

export default function CesiumGlobeView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { cesiumSatellites, observer, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!cesiumRef.current || !cesiumSatellites) return
        const { lon, lat } = observer
        const viewer = cesiumView(cesiumRef, { lon, lat, alt: 20000000.0 })

        addSatelliteVisuals3D({ satellites: cesiumSatellites, viewer })
        addObserver({ observer, viewer })

        // Debugging
        viewer.scene.debugShowFramesPerSecond = showFPS;

        return () => {
            viewer.destroy()
        }

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
