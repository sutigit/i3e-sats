import type { Satellite } from "../types"

const round = (val: number) => Math.round(val * 10) / 10;

const Measure = ({ label, value, unit }: { label: string, value: string | number, unit?: string }) => {
    const displayValue = typeof value === 'number' ? round(value) : value;

    return (
        <div style={{ minWidth: '70px', marginBottom: '0.5rem' }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '2px' }}>
                {label}
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>
                {displayValue} <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>{unit}</span>
            </p>
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

export const SatNearCard = ({ data }: { data: Satellite }) => {
    const s = data.stat;

    return (
        <div className="sat-card-nearest" style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', width: '100%' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>{data.name}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {/* <Measure label="Distance" value={s.look.range} unit="km" />
                <Measure label="Azimuth" value={s.look.azimuth} unit="°" />
                <Measure label="Elevation" value={s.look.elevation} unit="°" />
                <Measure label="Look" value={s.look.compass} /> */}
                <Measure label="Time to visible" value={0.0} unit="min" />
                <Measure label="Visible time" value={0.0} unit="min" />
                <Measure label="Observation window" value={0.0} unit="min" />
            </div>
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