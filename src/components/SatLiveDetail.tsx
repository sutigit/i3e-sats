import { useEffect, useState } from "preact/hooks"
import { useSatellites } from "../context/SatelliteContext"
import type { Satellite, SatLiveData } from "../types"
import { Measure } from "./common/Measure"
import { TabBody, TabContent, TabHeader } from "./common/Tabs"
import { LoadingAbsolute } from "./common/Loading"
import { lazy, Suspense } from "preact/compat"
import { getSatLiveData } from "../utils/getSatLiveData"

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
                    <LiveMeasurements satellite={targetSatellite} />
                </div>
            </div>
        </div>
    )
}

const LiveMeasurements = ({ satellite }: { satellite: Satellite | undefined }) => {
    const { observer } = useSatellites();
    const [tab, setTab] = useState<number>(0);
    const [liveData, setLiveData] = useState<SatLiveData | null>(null);
    const tabs = ['LIVE', 'LP1', 'LP2', 'LP3', 'LP4', 'LP5'];

    // Update every second
    useEffect(() => {
        if (!satellite) return;
        const tick = () => {
            const data = getSatLiveData(
                satellite.tle,
                observer.lat,
                observer.lon,
                0,
                new Date()
            );
            setLiveData(data);
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [satellite, observer]);

    if (!satellite || !liveData) return null;

    return (
        <div>
            <h3 style={{ padding: '1.5rem' }}>{satellite.name}</h3>
            <TabHeader tab={tab} setTab={setTab} tabs={tabs} />
            <TabBody tab={tab} tabs={tabs}>
                <TabContent active={tab === 0}>
                    <LiveDetail data={liveData} />
                </TabContent>
                {[1, 2, 3, 4, 5].map((spotIndex) => (
                    <TabContent active={tab === spotIndex} key={spotIndex}>
                        <LookPointDetail spot={spotIndex} data={liveData} />
                    </TabContent>
                ))}
            </TabBody>
        </div>
    );
};

const LiveDetail = ({ data }: { data: SatLiveData }) => {
    return (
        <div className="tab-body-page">
            <h3 className="title">Live details</h3>
            <div className="content">
                <Measure label="Speed" value={data.speed} unit="km/s" />
                <Measure label="Distance" value={data.distance} unit="km" />
                <Measure label="Altitude" value={data.altitude} unit="km" />
            </div>
            <div className="content">
                <Measure label="Compass" value={data.compass} />
                <Measure label="Azimuth" value={data.azimuth} unit="°" />
                <Measure label="Elevation" value={data.elevation} unit="°" />
            </div>
        </div>
    )
}

const LookPointDetail = ({ spot, data }: { spot: number, data: SatLiveData }) => {
    console.log("📌 data", data)
    return (
        <div className="tab-body-page">
            <h3 className="title">Look point {spot}</h3>
            <div className="content">
                <Measure label="Time to destination" value={0.0} unit="min" />
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
}