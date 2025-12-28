import { useEffect, useRef, useState } from "preact/hooks"
import { useSatellites } from "../context/SatelliteContext"
import type { LookPointLiveData, Satellite, SatLiveData, SatLiveDetailTabs, TargetLiveData } from "../types"
import { Measure } from "./common/Measure"
import { TabBody, TabContent, TabHeader } from "./common/Tabs"
import { LoadingAbsolute } from "./common/Loading"
import { lazy, Suspense, type RefObject } from "preact/compat"
import { getSatLiveData } from "../utils/getSatLiveData"
import { formatCountdown } from "../utils/formatting"
import type SatelliteTracker from "../cesium/utils/SatelliteTracker"

const CesiumMinimapView = lazy(() => import("./CesiumMinimapView"))

export default function SatLiveDetail() {
    const { targetSatellite } = useSatellites()
    const trackerRef = useRef<SatelliteTracker>(null);
    const [tab, setTab] = useState<SatLiveDetailTabs>("LIVE");

    useEffect(() => {
        if (!trackerRef.current || !targetSatellite) return
        trackerRef.current.track(targetSatellite.tle);
        setTab("LIVE")
    }, [targetSatellite])

    return (
        <div id="right-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <div id="cesium-minimap-container">
                        <div id="cesium-minimap-north-pointer">N</ div>
                        <Suspense fallback={<LoadingAbsolute />}>
                            <CesiumMinimapView trackerRef={trackerRef} />
                        </Suspense>
                    </div>
                    <LiveData tab={tab} setTab={setTab} targetSatellite={targetSatellite} trackerRef={trackerRef} />
                </div>
            </div>
        </div>
    )
}

const LiveData = ({ tab, setTab, targetSatellite, trackerRef }: { tab: SatLiveDetailTabs, setTab: (tab: SatLiveDetailTabs) => void, targetSatellite: Satellite | undefined, trackerRef: RefObject<SatelliteTracker> }) => {
    const { observer } = useSatellites();

    const [liveData, setLiveData] = useState<SatLiveData | null>(null);
    const tabs: SatLiveDetailTabs[] = ['LIVE', 'LP1', 'LP2', 'LP3', 'LP4', 'LP5'];

    const handleSetTab = (tab: SatLiveDetailTabs) => {
        if (!trackerRef.current || !targetSatellite || !liveData) return null;

        if (tab === "LIVE") {
            trackerRef.current.track(targetSatellite.tle);
        } else {
            const targetLookPoint = liveData.lookPointsWindow[tab]
            if (targetLookPoint) trackerRef.current.point(targetLookPoint);
        }
        setTab(tab)
    }

    // Update every second
    useEffect(() => {
        if (!targetSatellite) return;
        const tick = () => {
            const data = getSatLiveData(
                targetSatellite,
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
    }, [targetSatellite, observer]);

    if (!targetSatellite || !liveData) return null;

    return (
        <div>
            <h3 style={{ padding: '1.5rem' }}>{targetSatellite.name}</h3>
            <TabHeader tab={tab} setTab={handleSetTab} tabs={tabs} />
            <TabBody tab={tab}>
                <TabContent active={tab === "LIVE"}>
                    <LiveDetail data={liveData.live} />
                </TabContent>
                {liveData.lookPointsLive.map((lookPoint, i) => (
                    <TabContent active={tab === lookPoint.lp} key={lookPoint.lp}>
                        <LookPointDetail spot={i + 1} data={lookPoint} />
                    </TabContent>
                ))}
            </TabBody>
        </div>
    );
};

const LiveDetail = ({ data }: { data: TargetLiveData }) => {
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

const LookPointDetail = ({ spot, data }: { spot: number, data: LookPointLiveData }) => {
    return (
        <div className="tab-body-page">
            <h3 className="title">Look point {spot}</h3>
            <div className="content">
                <Measure label="Time to destination" value={formatCountdown(data.timeToDestination)} unit="min" />
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