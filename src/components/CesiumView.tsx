import { useEffect, useRef } from 'react'
import { cesiumView } from '../lib/cesiumRenderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useTleQuery } from '../queries/TleQuery';

export default function CesiumView() {
    const cesiumRef = useRef<HTMLDivElement>(null)
    const { data, isLoading, isSuccess, isError } = useTleQuery()

    useEffect(() => {
        if (!cesiumRef.current) return
        const viewer = cesiumView(cesiumRef)

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
