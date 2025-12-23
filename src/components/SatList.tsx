import { useEffect, useState } from "preact/hooks"
import { useTleMockQuery } from "../queries/TleQuery"
import type { SatelliteCardProps, TLE } from "../types"
import { SatNearCard, SatDistantCard } from "./SatCard"
import Loading from "./common/Loading"
import Divider from "./common/Divider"
import { getSatStats } from "../utils/getSatStats"
import { coords, satDataFallback } from "../utils/defaults"
import ObserverInput from "./ObserverInput"

export default function SatList() {
    const { data, isLoading, isSuccess, isError } = useTleMockQuery()
    const [dataList, setDataList] = useState<SatelliteCardProps[]>([])
    const [observerCoords, setObserverCoords] = useState({ lat: coords["otaniemi"].lat, lon: coords["otaniemi"].lon });

    useEffect(() => {
        if (!data) return;

        const satDat: SatelliteCardProps[] = data.map((d: TLE) => {
            const stats = getSatStats(d.tle, observerCoords.lat, observerCoords.lon);
            return { name: d.name, stat: stats || satDataFallback };
        });

        satDat.sort((a, b) => {
            const distA = a.stat.look.range;
            const distB = b.stat.look.range;

            // Fix: Treat '0' (Error/Fallback) as Infinity so it drops to the bottom
            if (distA === 0) return 1;
            if (distB === 0) return -1;

            // Standard Ascending Sort
            return distA - distB;
        });

        setDataList(satDat);
    }, [isSuccess, data, observerCoords])

    if (isLoading) return (<div id="left-panel"><Loading /></div>)
    if (isError) return (<div id="left-panel"><Error /></div>)

    return (
        <div id="left-panel">
            <div className="content">
                <h3>Ground observer</h3>
                <ObserverInput coords={observerCoords} setCoords={setObserverCoords} />
                <Divider />
                <h3>Nearest satellites</h3>
                <div className="item-list">
                    {dataList.slice(0, 3).map((sat: SatelliteCardProps) => (
                        <SatNearCard key={sat.name} data={sat} />
                    ))}
                </div>
                <Divider size="lg" />
                <div className="item-scroll-list">
                    {dataList.map((sat: SatelliteCardProps) => (
                        <SatDistantCard key={sat.name} data={sat} />
                    ))}
                </div>
            </div>
        </div>
    )
}
