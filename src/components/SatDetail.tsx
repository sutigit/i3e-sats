import { useEffect, useRef } from "preact/hooks"
import { cesiumView } from "../lib/cesiumRenderer"
import { coords } from "../utils/defaults"
import { addObserver } from "../draw/orbitEntities"

export default function SatDetail() {
    const cesiumRef = useRef(null)

    useEffect(() => {
        if (!cesiumRef.current) return
        const { lon, lat } = coords["otaniemi"]
        const viewer = cesiumView(cesiumRef, {
            lon,
            lat,
            height: 20000.0,
            radar: true,
        })
        addObserver({ coords: coords["otaniemi"], viewer })

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
