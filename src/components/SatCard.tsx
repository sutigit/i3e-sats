import type { Satellite } from "../types"

const round = (val: number) => Math.round(val * 10) / 10;

const Measure = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => {
    const displayValue = typeof value === 'number' ? round(value) : value;
    return (
        <div className="measure">
            <p className="label">{label}</p>
            <p className="value">{displayValue} <span className="unit">{unit}</span></p>
        </div>
    )
}

const MeasureMin = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => {
    const displayValue = typeof value === 'number' ? round(value) : value;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', gap: 6 }}>
            <p style={{ opacity: 0.6 }}>{label}</p>
            <p style={{ fontWeight: 600 }}>
                {displayValue} {unit && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{unit}</span>}
            </p>
        </div>
    )
}

export const SatNearCard = ({ focus, data }: { focus: boolean, data: Satellite }) => {
    const s = data.stat;

    return (
        <div className={`sat-card-primary ${focus ? 'focus' : ''}`}>
            <p className="name">{data.name}</p>
            <Measure label="Time to visible" value={0.0} unit="min" />
            <Measure label="Visible time" value={0.0} unit="min" />
        </div>
    )
}

export const SatDistantCard = ({ data }: { data: Satellite }) => {
    const s = data.stat;

    return (
        <div className="sat-card-distant">
            <p style={{ fontSize: '0.9rem' }}>{data.name}</p>
            <MeasureMin label="" value={s.look.range} unit="km" />
        </div>
    )
}