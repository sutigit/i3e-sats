import { useEffect, useRef } from "preact/hooks"
import { cesiumView } from "../cesium/renderer"
import { addObserverGround } from "../cesium/add"
import { useSatellites } from "../context/ContextAPI"

export default function SatDetail() {
    const cesiumRef = useRef(null)
    const { observer } = useSatellites()

    useEffect(() => {
        if (!cesiumRef.current) return
        const { lon, lat } = observer
        const viewer = cesiumView(cesiumRef, {
            lon,
            lat,
            height: 20000.0,
            radar: true,
        })
        addObserverGround({ observer, viewer })

        return (() => {
            viewer.destroy()
        })
    }, [])

    return (
        <div id="right-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <div id="cesium-tracker-view-container">
                        <div id="cesium-tracker-view" ref={cesiumRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
                    </div>

                    <div className="" style={{ padding: '1rem 1.5rem' }}>
                        hello
                    </div>
                </div>
            </div>
        </div>
    )
}
