import { useEffect, useState } from "preact/hooks"
import { useTleMockQuery } from "../queries/TleQuery"
import type { TLE } from "../types"

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

    if (isLoading) return (<div className="sat-list"><div className="content centered">Loading data...</div></div>)
    if (isError) return (<div className="sat-list"><div className="content centered">Error</div></div>)

    return (
        <div className="sat-list">
            <div className="content">
                <div className="content-container">Location</div>
                <div className="list-container">
                    <p>Nearest</p>
                    {dataList.map((sat: SatelliteData) => (
                        <div key={sat.name} class="list-item">
                            {sat.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
