import { TelescopeIcon } from "./common/TelescopeIcon";

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

    return (
        <div className="observer-input">
            <div className="number-input">
                <label>Latitude</label>
                <input
                    type="number"
                    step="any"
                    value={coords.lat}
                    onChange={(e) => update('lat', (e.target as HTMLInputElement).value)}
                />
            </div>

            <div className="number-input">
                <label>Longitude</label>
                <input
                    type="number"
                    step="any"
                    value={coords.lon}
                    onChange={(e) => update('lon', (e.target as HTMLInputElement).value)}
                />
            </div>

            <button
                className="observer-button"
                onClick={onFly}
                title="Fly to coordinates"
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
                <label>Fly to</label>
                <TelescopeIcon />
            </button>
        </div>
    )
}