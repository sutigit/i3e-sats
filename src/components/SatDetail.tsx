import { useEffect, useRef, useState } from "preact/hooks"
import { cesiumView } from "../cesium/renderer"
import { addObserverGround, addSatellitePointGround, addSatellitePathGround } from "../cesium/add"
import { useSatellites } from "../context/ContextAPI"
import type { Satellite } from "../types"
import { Measure } from "./common/Measure"
import { TabBody, TabHeader } from "./common/Tabs"

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
    const [tab, setTab] = useState<number>(0)
    const tabs = ['LIVE', 'L1', 'L2', 'L3', 'L4', 'L5']
    const renderTabPage = (tab: number) => (tab === 0 ? <LiveSatelliteDetail /> : <LookUpSpotDetail spot={tab} />)

    return (
        <div>
            <h3 style={{ padding: '1.5rem' }}>{satellite.name}</h3>
            <TabHeader tab={tab} setTab={setTab} tabs={tabs} />
            <TabBody tab={tab} tabs={tabs}>
                {renderTabPage(tab)}
            </TabBody>
        </div>
    )
}

const LiveSatelliteDetail = () => (
    <div className="tab-body-page">
        <h4 className="title">Live details</h4>
        <div className="content">
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Speed" value={0.0} unit="km/s" />
        </div>
    </div>
)

const LookUpSpotDetail = ({ spot }: { spot: number }) => (
    <div className="tab-body-page">
        <h4 className="title">Look up {spot}</h4>
        <div className="content">
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Speed" value={0.0} unit="km/s" />
        </div>
    </div>
)