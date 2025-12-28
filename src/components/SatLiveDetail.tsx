import { useState } from "preact/hooks"
import { useSatellites } from "../context/SatelliteContext"
import type { Satellite } from "../types"
import { Measure } from "./common/Measure"
import { TabBody, TabHeader } from "./common/Tabs"
import { LoadingAbsolute } from "./common/Loading"
import { lazy, Suspense } from "preact/compat"

const CesiumMinimapView = lazy(() => import("./CesiumMinimapView"))

export default function SatLiveDetail() {
    const { targetSatellite } = useSatellites()

    return (
        <div id="right-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <div id="cesium-minimap-container">
                        <div id="cesium-minimap-north-pointer">N</ div>
                        <Suspense fallback={<LoadingAbsolute />}>
                            <CesiumMinimapView />
                        </Suspense>
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
    const tabs = ['LIVE', 'LP1', 'LP2', 'LP3', 'LP4', 'LP5']
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
        <h3 className="title">Live details</h3>
        <div className="content">
            <Measure label="Speed" value={0.0} unit="km/s" />
            <Measure label="Distance" value={0.0} unit="km" />
            <Measure label="Altitude" value={0.0} unit="km" />
        </div>
        <div className="content">
            <Measure label="Compass" value={"NW"} />
            <Measure label="Azimuth" value={0.0} unit="°" />
            <Measure label="Elevation" value={0.0} unit="°" />
        </div>
    </div>
)

const LookUpSpotDetail = ({ spot }: { spot: number }) => (
    <div className="tab-body-page">
        <h3 className="title">Look point {spot}</h3>
        <div className="content">
            <Measure label="Time to visible" value={0.0} unit="min" />
            <Measure label="Distance" value={0.0} unit="km" />
            <Measure label="Altitude" value={0.0} unit="km" />
        </div>
        <div className="content">
            <Measure label="Compass" value={"NW"} />
            <Measure label="Azimuth" value={0.0} unit="°" />
            <Measure label="Elevation" value={0.0} unit="°" />
        </div>
    </div>
)