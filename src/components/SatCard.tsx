import type { Satellite } from "../types"
import { Measure } from "./common/Measure";

export const SatPrimaryCard = ({ focus, data }: { focus: boolean, data: Satellite }) => {
    const s = data.stat;

    return (
        <div className={`sat-primary ${focus ? 'focus' : ''}`}>
            <p className="name">{data.name}</p>
            <Measure label="Time to visible" value={0.0} unit="min" />
            <Measure label="Visible time" value={0.0} unit="min" />
        </div>
    )
}

export const SatSecondaryCard = ({ focus, data }: { focus: boolean, data: Satellite }) => {
    const s = data.stat;

    return (
        <div className={`sat-secondary ${focus ? 'focus' : ''}`}>
            <p className="name">{data.name}</p>
            <Measure label="" value={46} unit="min" variant="minified" />
        </div>
    )
}