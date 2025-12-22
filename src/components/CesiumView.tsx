import { useEffect, useRef } from 'react'
import { cesiumView } from '../lib/cesiumRenderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useTleQuery, useTleMockQuery } from '../queries/TleQuery';
import { addPaths, addPoints, addTrails } from './draw/orbitEntities';

const coords = {
    "otaniemi": { lon: 24.83, lat: 60.18 }
}

export default function CesiumView() {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { data, isLoading, isSuccess, isError } = useTleMockQuery()

    useEffect(() => {
        if (!cesiumRef.current) return
        const { lon, lat } = coords["otaniemi"]
        const viewer = cesiumView(cesiumRef, { lon, lat, height: 30000000.0 })
        addPaths({ data, viewer })
        addTrails({ data, viewer })
        addPoints({ data, viewer })

        return () => {
            viewer.destroy()
        }
    }, [isSuccess])

    if (isLoading) return (<div>Loading data...</div>)
    if (isError) return (<div>Error</div>)

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
