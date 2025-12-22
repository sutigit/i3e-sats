import { useEffect, useRef } from 'react'
import { cesiumView } from '../lib/cesiumRenderer'
import "cesium/Build/Cesium/Widgets/widgets.css";
import { useTleQuery } from '../queries/TleQuery';
import type { TLE } from '../types';
import { getLatLngObj } from 'tle.js';
import { type Viewer } from 'cesium';
import { addShapes, box, polylineGround, polylineSpace } from './debug/geometries';

const coords = {
    "otaniemi": { lon: 24.83, lat: 60.18 }
}

// const addSatellites = ({ data, viewer }: { data: TLE[] | undefined, viewer: Viewer }) => {
//     if (!data) return
//     console.log("📌 data", data)
//     data.forEach((d: TLE) => {
//         const hmm = getLatLngObj(`${d.name}\r${d.line1}\r${d.line2}`)
//         console.log("📌 d", hmm)
//     })

// }



export default function CesiumView() {
    const cesiumRef = useRef<HTMLDivElement>(null)
    // const { data, isLoading, isSuccess, isError } = useTleQuery()

    // useEffect(() => {
    //     if (!cesiumRef.current) return
    //     const { lon, lat } = coords["otaniemi"]
    //     const viewer = cesiumView(cesiumRef, { lon, lat, height: 40000000.0 })
    //     addSatellites({ data, viewer })

    //     return () => {
    //         viewer.destroy()
    //     }
    // }, [isSuccess])

    useEffect(() => {
        if (!cesiumRef.current) return
        const { lon, lat } = coords["otaniemi"]
        const viewer = cesiumView(cesiumRef, { lon, lat, height: 35000000.0 })

        // addShapes(viewer, [polylineSpace])

        return () => {
            viewer.destroy()
        }
    }, [])


    // if (isLoading) return (<div>Loading data...</div>)
    // if (isError) return (<div>Error</div>)

    return (
        <div ref={cesiumRef} id='cesium-view' />
    )
}
