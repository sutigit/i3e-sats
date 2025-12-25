import type { Satellite } from "../types"

const round = (val: number) => Math.round(val * 10) / 10;

const Measure = ({ label, value, unit, variant = "normal" }: { label: string, value: string | number, unit?: string, variant?: 'normal' | 'minified' }) => {
    const displayValue = typeof value === 'number' ? round(value) : value;

    return (
        <div className="measure">
            {variant === "normal" && <p className="label">{label}</p>}
            <p className="value">{displayValue} <span className="unit">{unit}</span></p>
        </div>
    )
}

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