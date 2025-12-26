import { useEffect, useRef } from "preact/hooks"
import { cesiumView } from "../cesium/renderer"
import { addObserverGround, addSatellitePointGround, addSatellitePathGround } from "../cesium/add"
import { useSatellites } from "../context/ContextAPI"
import type { Satellite } from "../types"
import { Measure } from "./common/Measure"

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

                    <SatelliteDetails satellite={targetSatellite} />
                </div>
            </div>
        </div>
    )
}

const SatelliteDetails = ({ satellite }: { satellite: Satellite | undefined }) => {
    if (!satellite) return

    return (
        <div className="" >
            <h3 style={{ padding: '1.5rem' }}>{satellite.name}</h3>
            <Tabs tab={0} />
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', gap: 5, flexWrap: 'wrap' }}>
                <Measure label="Speed" value={0.0} unit="km/s" />
                <Measure label="Speed" value={0.0} unit="km/s" />
                <Measure label="Speed" value={0.0} unit="km/s" />
                <Measure label="Speed" value={0.0} unit="km/s" />
            </div>
        </div>
    )
}

const Tabs = ({ tab }: { tab: number }) => {
    return (
        <div style={{ display: 'flex', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'pink', height: '0.6rem' }} />
            <div style={{ zIndex: 2, flex: 1, borderRadius: '0.8rem', display: 'flex', justifyContent: 'center', padding: '0.6rem 0', backgroundColor: 'pink' }}>Live</div>
            <div style={{ zIndex: 2, flex: 1, borderRadius: '0.8rem', display: 'flex', justifyContent: 'center', padding: '0.6rem 0', backgroundColor: 'coral' }}>LP1</div>
            <div style={{ zIndex: 2, flex: 1, borderRadius: '0.8rem', display: 'flex', justifyContent: 'center', padding: '0.6rem 0', backgroundColor: 'coral' }}>LP2</div>
            <div style={{ zIndex: 2, flex: 1, borderRadius: '0.8rem', display: 'flex', justifyContent: 'center', padding: '0.6rem 0', backgroundColor: 'coral' }}>LP3</div>
            <div style={{ zIndex: 2, flex: 1, borderRadius: '0.8rem', display: 'flex', justifyContent: 'center', padding: '0.6rem 0', backgroundColor: 'coral' }}>LP4</div>
            <div style={{ zIndex: 2, flex: 1, borderRadius: '0.8rem', display: 'flex', justifyContent: 'center', padding: '0.6rem 0', backgroundColor: 'coral' }}>LP5</div>
        </div>
    )
}