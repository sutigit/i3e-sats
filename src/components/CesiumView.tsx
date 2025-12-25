import { useEffect, useRef } from 'react'
import { cesiumView } from '../cesium/cesiumRenderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { addObserver, addPaths, addPoints, addTrails } from '../cesium/cesiumAdd';
import Loading from './common/Loading';
import { useSatellites } from '../context/ContextAPI';



export default function CesiumView() {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { satellites, observer, isLoading, isError } = useSatellites()

    useEffect(() => {
        if (!cesiumRef.current || !satellites) return
        const { lon, lat } = observer
        const viewer = cesiumView(cesiumRef, { lon, lat, height: 24000000.0 })
        addPaths({ satellites, viewer })
        addTrails({ satellites, viewer })
        addPoints({ satellites, viewer })
        addObserver({ observer, viewer })

        return () => {
            viewer.destroy()
        }
    }, [satellites])

    if (isLoading) return (<Loading />)
    if (isError) return (<Error />)

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
