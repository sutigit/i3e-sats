import type { Satellite } from "../types"
import { Measure } from "./common/Measure";

export const SatPrimary = ({ focus, setFocus, sat }: { focus: boolean, setFocus: () => void; sat: Satellite }) => {

    return (
        <div className={`sat-primary ${focus ? 'focus' : ''}`} onClick={setFocus}>
            <p className="name">{sat.name}</p>
            <Measure label="Time to visible" value={0.0} unit="min" />
            <Measure label="Visible time" value={0.0} unit="min" />
        </div>
    )
}

export const SatSecondary = ({ focus, setFocus, sat }: { focus: boolean, setFocus: () => void, sat: Satellite }) => {

    return (
        <div className={`sat-secondary ${focus ? 'focus' : ''}`} onClick={setFocus}>
            <p className="name">{sat.name}</p>
            <Measure label="" value={46} unit="min" variant="minified" />
        </div>
    )
}