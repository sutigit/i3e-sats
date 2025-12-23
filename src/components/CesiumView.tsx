import { useEffect, useRef } from 'react'
import { cesiumView } from '../lib/cesiumRenderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useTleQuery, useTleMockQuery } from '../queries/TleQuery';
import { addObserver, addPaths, addPoints, addTrails } from '../draw/orbitEntities';
import Loading from './common/Loading';
import { coords } from '../utils/defaults';



export default function CesiumView() {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { data, isLoading, isSuccess, isError } = useTleMockQuery()

    useEffect(() => {
        if (!cesiumRef.current) return
        const { lon, lat } = coords["otaniemi"]
        const viewer = cesiumView(cesiumRef, { lon, lat, height: 24000000.0 })
        addPaths({ data, viewer })
        addTrails({ data, viewer })
        addPoints({ data, viewer })
        addObserver({ coords: coords["otaniemi"], viewer })

        return () => {
            viewer.destroy()
        }
    }, [isSuccess])

    if (isLoading) return (<Loading />)
    if (isError) return (<Error />)

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
