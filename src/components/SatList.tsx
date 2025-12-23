import { useEffect, useState } from "preact/hooks"
import { useTleMockQuery } from "../queries/TleQuery"
import type { TLE } from "../types"
import Loading from "./common/Loading"

type SatelliteData = {
    name: string
}

export default function SatList() {
    const { data, isLoading, isSuccess, isError } = useTleMockQuery()
    const [dataList, setDataList] = useState<SatelliteData[]>([])

    useEffect(() => {
        if (!data) return

        const rec = data.map((d: TLE) => {
            return { name: d.name }
        })

        setDataList(rec)

    }, [isSuccess])

    if (isLoading) return (<div id="sat-list"><Loading /></div>)
    if (isError) return (<div id="sat-list"><Error /></div>)

    return (
        <div id="sat-list">
            <div className="content">
                {/* <div className="content">Location</div>
                <div className="content">
                    <p>Nearest</p>
                    {dataList.map((sat: SatelliteData) => (
                        <div key={sat.name} class="list-item">
                            {sat.name}
                        </div>
                    ))}
                </div> */}
            </div>
        </div>
    )
}
