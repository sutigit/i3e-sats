interface Coords {
    lat: number;
    lon: number;
}

interface ObserverInputProps {
    coords: Coords;
    setCoords: (val: Coords) => void;
    onFly?: () => void;
}

export default function ObserverInput({ coords, setCoords, onFly }: ObserverInputProps) {

    const update = (field: 'lat' | 'lon', value: string) => {
        setCoords({
            ...coords,
            [field]: parseFloat(value) || 0
        });
    };

    const baseStyle = {
        padding: '8px 12px',
        borderRadius: '6px',
        border: 'none',
        outline: 'none',
        fontSize: '0.9rem',
        backgroundColor: '#09090b',
        color: 'inherit'
    };

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Latitude</label>
                <input
                    type="number"
                    step="any"
                    value={coords.lat}
                    onChange={(e) => update('lat', (e.target as HTMLInputElement).value)}
                    style={{ ...baseStyle, width: '100%' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Longitude</label>
                <input
                    type="number"
                    step="any"
                    value={coords.lon}
                    onChange={(e) => update('lon', (e.target as HTMLInputElement).value)}
                    style={{ ...baseStyle, width: '100%' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Fly to</label>
                <button
                    onClick={onFly}
                    style={{
                        ...baseStyle,
                        backgroundColor: '#27272a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.2s'
                    }}
                    title="Fly to coordinates"
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                    {/* Navigation Arrow Icon */}
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#d8b4fe"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                </button>
            </div>
        </div>
    )
}