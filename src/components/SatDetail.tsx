import { useEffect, useRef } from "preact/hooks"
import { cesiumView } from "../lib/cesiumRenderer"
import { addObserver } from "../draw/orbitEntities"
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
        addObserver({ observer, viewer })

        return (() => {
            viewer.destroy()
        })
    }, [])

    return (
        <div id="right-panel">
            <div className="content" >
                <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: 'gray', borderRadius: '1rem', overflow: 'hidden' }}>
                    <div ref={cesiumRef} style={{ position: 'absolute', inset: '0 0 0 0' }} />
                </div>
            </div>
        </div>
    )
}
