import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addSatellite3DVisuals } from '../cesium/add';
import Loading from './common/Loading';
import { useSatellites } from '../context/ContextAPI';

export default function CesiumGlobeView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { satellites, observer, isLoading, isError, satellitesReady } = useSatellites()

    useEffect(() => {
        if (!cesiumRef.current || !satellites) return
        const { lon, lat } = observer
        const viewer = cesiumView(cesiumRef, { lon, lat, alt: 24000000.0 })
        addSatellite3DVisuals({ satellites, viewer })
        addObserver({ observer, viewer })

        // Debugging
        viewer.scene.debugShowFramesPerSecond = showFPS;

        return () => {
            viewer.destroy()
        }

        // never re-render this to avoid re-instantiating cesium renderer.
    }, [satellitesReady])

    if (isLoading) return (<Loading />)
    if (isError) return (<Error />)

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
