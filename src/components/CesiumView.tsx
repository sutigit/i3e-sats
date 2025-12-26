import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/renderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserverGround, addSatellitePathsSpace, addSatellitePointsSpace, addSatelliteTrailsSpace } from '../cesium/add';
import Loading from './common/Loading';
import { useSatellites } from '../context/ContextAPI';



export default function CesiumView({ showFPS = false }: { showFPS?: boolean }) {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { satellites, observer, isLoading, isError } = useSatellites()

    useEffect(() => {
        if (!cesiumRef.current || !satellites) return
        const { lon, lat } = observer
        const viewer = cesiumView(cesiumRef, { lon, lat, alt: 24000000.0 })
        addSatellitePathsSpace({ satellites, viewer })
        addSatelliteTrailsSpace({ satellites, viewer })
        addSatellitePointsSpace({ satellites, viewer })
        addObserverGround({ observer, viewer })

        // Debugging
        viewer.scene.debugShowFramesPerSecond = showFPS;

        return () => {
            viewer.destroy()
        }

        // never re-render this. modify entities for animations
    }, [satellites])

    if (isLoading) return (<Loading />)
    if (isError) return (<Error />)

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
