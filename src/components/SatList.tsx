import { useEffect, useState } from "preact/hooks"
import { useTleMockQuery } from "../queries/TleQuery"
import type { SatelliteCardProps, TLE } from "../types"
import { SatNearCard, SatDistantCard } from "./SatCard"
import Loading from "./common/Loading"
import Divider from "./common/Divider"

export default function SatList() {
    const { data, isLoading, isSuccess, isError } = useTleMockQuery()
    const [dataList, setDataList] = useState<SatelliteCardProps[]>([])

    useEffect(() => {
        if (!data) return
        const list = data.map((d: TLE) => ({ name: d.name }))
        setDataList(list)
    }, [isSuccess])

    if (isLoading) return (<div id="left-panel"><Loading /></div>)
    if (isError) return (<div id="left-panel"><Error /></div>)

    return (
        <div id="left-panel">
            <div className="content">
                <h3>Ground observer</h3>
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
