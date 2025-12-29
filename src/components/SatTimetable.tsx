import type { Satellite } from "../types"
import { SatPrimary, SatSecondary } from "./SatCard"
import { Loading } from "./common/Loading"
import ObserverInput from "./ObserverInput"
import { useSatellites } from "../context/SatelliteContext"
import { Suspense } from "preact/compat"

export default function SatList() {
    const { timetableSatellites, targetSatellite, setTargetSatellite, observer, setObserver, setMobileOpenMinimap } = useSatellites();

    const handleFocus = (sat: Satellite) => {
        setTargetSatellite(sat)
        setMobileOpenMinimap(true)
    }

    return (
        <div className="sat-timetable">
            <div className="panel-content">
                <div className="panel-content-item">
                    <div className="mobile-pull-widget" />
                    <h2 className="panel-content-title">My location</h2>
                    <ObserverInput coords={observer} setCoords={setObserver} />
                </div>

                <div className="panel-content-item">
                    <h4 className="panel-content-title">Nearest visible satellites</h4>
                    <div className="sat-primary-list">
                        <Suspense fallback={<Loading />}>
                            {timetableSatellites.slice(0, 4).map((sat: Satellite) => (
                                <SatPrimary
                                    key={sat.name}
                                    setFocus={() => handleFocus(sat)}
                                    focus={sat.name === targetSatellite?.name}
                                    satellite={sat}
                                />
                            ))}
                        </Suspense>
                    </div>
                </div>

                <div className="panel-content-item max-height">
                    <h4 className="panel-content-title">
                        All
                        <span className="second-title">Time to visible</span>
                    </h4>
                    <div className="sat-secondary-list">
                        <Suspense fallback={<Loading />}>
                            {timetableSatellites.slice(4).map((sat: Satellite) => (
                                <SatSecondary
                                    key={sat.name}
                                    setFocus={() => handleFocus(sat)}
                                    focus={sat.name === targetSatellite?.name}
                                    satellite={sat}
                                />
                            ))}
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}
