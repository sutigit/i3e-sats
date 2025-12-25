import type { Satellite } from "../types"
import { SatNearCard, SatDistantCard } from "./SatCard"
import Loading from "./common/Loading"
import ObserverInput from "./ObserverInput"
import { useSatellites } from "../context/ContextAPI"

export default function SatList() {
    const { satellites, focus, observer, setObserver, isLoading, isError } = useSatellites();
    if (isLoading) return (<div id="left-panel"><Loading /></div>)
    if (isError) return (<div id="left-panel"><Error /></div>)

    return (
        <div id="left-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <h4 className="panel-content-title">Ground observer</h4>
                    <ObserverInput coords={observer} setCoords={setObserver} />
                </div>

                <div className="panel-content-item">
                    <h4 className="panel-content-title">Nearest visible time</h4>
                    <div className="sat-primary-list">
                        {satellites.slice(0, 3).map((sat: Satellite) => (
                            <SatNearCard focus={sat.name === focus?.name} key={sat.name} data={sat} />
                        ))}
                    </div>
                </div>

                {/* <div className="content-panel">
                    <div className="satellite-secondary-list">
                        {satellites.map((sat: Satellite) => (
                            <SatDistantCard key={sat.name} data={sat} />
                        ))}
                    </div>
                </div> */}
            </div>
        </div>
    )
}
