import type { SatelliteCardProps } from "../types"

const Measure = ({ label, value }: { label: string, value: number }) => {
    return (
        <div>
            <p style={{ fontSize: '0.8rem' }}>{label}</p>
            <p>{value}</p>
        </div>
    )
}

export const SatNearCard = ({ data }: { data: SatelliteCardProps }) => {
    return (
        <div className="sat-card-nearest">
            <p style={{ fontSize: '0.9rem' }}>{data.name}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: 3, flexWrap: 'wrap' }}>
                <Measure label="coord" value={0.0} />
                <Measure label="altitude" value={0.0} />
                <Measure label="speed" value={0.0} />
                <Measure label="distance" value={0.0} />
            </div>
        </div>
    )
}

export const SatDistantCard = ({ data }: { data: SatelliteCardProps }) => {
    return (
        <div className="sat-card-distant">
            {data.name}
        </div>
    )
}