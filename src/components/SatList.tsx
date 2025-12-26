import type { Satellite } from "../types"
import { SatPrimary, SatSecondary } from "./SatCard"
import Loading from "./common/Loading"
import ObserverInput from "./ObserverInput"
import { useSatellites } from "../context/ContextAPI"

export default function SatList() {
    const { satellites, targetSatellite, setTargetSatellite, observer, setObserver, isLoading, isError } = useSatellites();
    if (isLoading) return (<div id="left-panel"><Loading /></div>)
    if (isError) return (<div id="left-panel"><Error /></div>)

    return (
        <div id="left-panel">
            <div className="panel-content">
                <div className="panel-content-item">
                    <h4 className="panel-content-title">My location</h4>
                    <ObserverInput coords={observer} setCoords={setObserver} />
                </div>

                <div className="panel-content-item">
                    <h4 className="panel-content-title">Nearest visible time</h4>
                    <div className="sat-primary-list">
                        {satellites.slice(0, 4).map((sat: Satellite) => (
                            <SatPrimary
                                key={sat.name}
                                setFocus={() => setTargetSatellite(sat)}
                                focus={sat.name === targetSatellite?.name}
                                data={sat}
                            />
                        ))}
                    </div>
                </div>

                <div className="panel-content-item max-height">
                    <h4 className="panel-content-title">
                        All
                        <span className="second-title">Time to visible</span>
                    </h4>
                    <div className="sat-secondary-list">
                        {satellites.map((sat: Satellite) => (
                            <SatSecondary
                                key={sat.name}
                                setFocus={() => setTargetSatellite(sat)}
                                focus={sat.name === targetSatellite?.name}
                                data={sat}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
