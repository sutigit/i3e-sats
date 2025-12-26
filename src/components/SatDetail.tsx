import { useState } from "preact/hooks"
import { useSatellites } from "../context/ContextAPI"
import type { Satellite } from "../types"
import { Measure } from "./common/Measure"
import { TabBody, TabHeader } from "./common/Tabs"
import CesiumMinimapView from "./CesiumMinimapView"
import Loading from "./common/Loading"
import Error from "./common/Error"

export default function SatDetail() {
    const { targetSatellite, isLoading, isError } = useSatellites()

    if (isLoading) return (<div id="left-panel"><Loading /></div>)
    if (isError) return (<div id="left-panel"><Error /></div>)

    return (
        <div id="right-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <CesiumMinimapView />
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