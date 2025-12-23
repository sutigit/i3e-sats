import { useEffect, useState } from "preact/hooks"
import { useTleMockQuery } from "../queries/TleQuery"
import type { TLE } from "../types"
import Loading from "./common/Loading"
import Divider from "./common/Divider"

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
                <h2>My location</h2>
                <Divider />
                <h2>Nearest</h2>
                {/*
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
