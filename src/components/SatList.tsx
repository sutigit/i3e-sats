import type { Satellite } from "../types"
import { SatNearCard, SatDistantCard } from "./SatCard"
import Loading from "./common/Loading"
import Divider from "./common/Divider"
import ObserverInput from "./ObserverInput"
import { useSatellites } from "../context/ContextAPI"

export default function SatList() {
    const { satellites, observer, setObserver, isLoading, isError } = useSatellites();
    if (isLoading) return (<div id="left-panel"><Loading /></div>)
    if (isError) return (<div id="left-panel"><Error /></div>)

    return (
        <div id="left-panel">
            <div className="content">
                <h3>Ground observer</h3>
                <ObserverInput coords={observer} setCoords={setObserver} />
                <Divider />
                <h3>Nearest visible time</h3>
                <div className="item-list">
                    {satellites.slice(0, 3).map((sat: Satellite) => (
                        <SatNearCard key={sat.name} data={sat} />
                    ))}
                </div>
                <Divider size="lg" />
                <div className="item-scroll-list">
                    {satellites.map((sat: Satellite) => (
                        <SatDistantCard key={sat.name} data={sat} />
                    ))}
                </div>
            </div>
        </div>
    )
}
