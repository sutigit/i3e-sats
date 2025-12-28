import { useEffect, useRef, useState } from "preact/hooks";
import { lazy, Suspense, type RefObject } from "preact/compat";
import { useSatellites } from "../context/SatelliteContext";
import { getSatLiveData } from "../utils/getSatLiveData";
import { formatCountdown } from "../utils/formatting";
import type {
    LookPointLiveData,
    Satellite,
    SatLiveData,
    SatLiveDetailTabs,
    TargetLiveData
} from "../types";
import type SatelliteTracker from "../cesium/utils/SatelliteTracker";

import { Measure } from "./common/Measure";
import { TabBody, TabContent, TabHeader } from "./common/Tabs";
import { LoadingAbsolute } from "./common/Loading";

const CesiumMinimapView = lazy(() => import("./CesiumMinimapView"));

const useSatLiveData = (satellite: Satellite | undefined) => {
    const { observer } = useSatellites();
    const [data, setData] = useState<SatLiveData | null>(null);

    useEffect(() => {
        if (!satellite) return;

        const tick = () => {
            const currentData = getSatLiveData(
                satellite,
                observer.lat,
                observer.lon,
                0,
                new Date()
            );
            setData(currentData);
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [satellite, observer]);

    return data;
};

// --- MAIN COMPONENT ---
export default function SatLiveDetail() {
    const { targetSatellite } = useSatellites();
    const trackerRef = useRef<SatelliteTracker>(null);
    const [tab, setTab] = useState<SatLiveDetailTabs>("LIVE");

    // Reset to LIVE mode when satellite changes
    useEffect(() => {
        if (trackerRef.current && targetSatellite) {
            trackerRef.current.track(targetSatellite.tle);
            setTab("LIVE");
        }
    }, [targetSatellite]);

    return (
        <div id="right-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <div id="cesium-minimap-container">
                        <div id="cesium-minimap-north-pointer">N</div>
                        <Suspense fallback={<LoadingAbsolute />}>
                            <CesiumMinimapView trackerRef={trackerRef} />
                        </Suspense>
                    </div>

                    <LiveDataPanel
                        tab={tab}
                        setTab={setTab}
                        targetSatellite={targetSatellite}
                        trackerRef={trackerRef}
                    />
                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---
type LiveDataPanelProps = {
    tab: SatLiveDetailTabs;
    setTab: (tab: SatLiveDetailTabs) => void;
    targetSatellite: Satellite | undefined;
    trackerRef: RefObject<SatelliteTracker>;
};

const LiveDataPanel = ({ tab, setTab, targetSatellite, trackerRef }: LiveDataPanelProps) => {
    const liveData = useSatLiveData(targetSatellite);
    const tabs: SatLiveDetailTabs[] = ['LIVE', 'LP1', 'LP2', 'LP3', 'LP4', 'LP5'];

    if (!targetSatellite || !liveData) return null;

    const handleTabChange = (newTab: SatLiveDetailTabs) => {
        if (!trackerRef.current) return;

        if (newTab === "LIVE") {
            trackerRef.current.track(targetSatellite.tle);
        } else {
            const targetLookPoint = liveData.lookPointsWindow[newTab];
            if (targetLookPoint) {
                trackerRef.current.point(targetLookPoint);
            }
        }
        setTab(newTab);
    };

    return (
        <div>
            <h3 style={{ padding: '1.5rem' }}>{targetSatellite.name}</h3>

            <TabHeader tab={tab} setTab={handleTabChange} tabs={tabs} />

            <TabBody tab={tab}>
                <TabContent active={tab === "LIVE"}>
                    <LiveDetailPage data={liveData.live} />
                </TabContent>

                {liveData.lookPointsLive.map((lpData, i) => (
                    <TabContent active={tab === lpData.lp} key={lpData.lp}>
                        <LookPointDetailPage spot={i + 1} data={lpData} />
                    </TabContent>
                ))}
            </TabBody>
        </div>
    );
};

const LiveDetailPage = ({ data }: { data: TargetLiveData }) => (
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
);

const LookPointDetailPage = ({ spot, data }: { spot: number, data: LookPointLiveData }) => (
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
);