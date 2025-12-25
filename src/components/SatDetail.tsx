import { useEffect, useRef } from "preact/hooks"
import { cesiumView } from "../cesium/renderer"
import { addObserverGround, addSatellitePointGround, addSatellitePathGround } from "../cesium/add"
import { useSatellites } from "../context/ContextAPI"

export default function SatDetail() {
    const cesiumMinimapRef = useRef(null)
    const { observer, targetSatellite } = useSatellites()

    useEffect(() => {
        if (!cesiumMinimapRef.current || !targetSatellite) return
        const viewer = cesiumView(cesiumMinimapRef, {
            lon: targetSatellite.stat.location.lon,
            lat: targetSatellite.stat.location.lat,
            alt: 100000.0,
            minimap: true,
        })
        addObserverGround({ observer, viewer })
        addSatellitePointGround({ satellite: targetSatellite, viewer })
        addSatellitePathGround({ satellite: targetSatellite, viewer })

        return (() => {
            viewer.destroy()
        })

        // never re-render this. modify entities for animations
    }, [targetSatellite])

    return (
        <div id="right-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <div id="cesium-minimap-container">
                        <div id="cesium-minimap-view" ref={cesiumMinimapRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
                    </div>

                    <div className="" style={{ padding: '1rem 1.5rem' }}>
                        hello
                    </div>
                </div>
            </div>
        </div>
    )
}
