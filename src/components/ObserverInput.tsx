import { Cartesian3 } from "cesium";
import { useSatellites } from "../context/SatelliteContext";
import { PencilIcon } from "./common/PencilIcon";
import { PinIcon } from "./common/PinIcon";

interface Coords {
    lat: number;
    lon: number;
}

interface ObserverInputProps {
    coords: Coords;
    setCoords: (val: Coords) => void;
}

const GLOBE_ALTITUDE = 20000000.0

export default function ObserverInput({ coords, setCoords }: ObserverInputProps) {
    const { cesiumGlobeRef, observer } = useSatellites();


    const onFly = () => {
        if (!cesiumGlobeRef.current) return;
        const location = Cartesian3.fromDegrees(observer.lon, observer.lat, GLOBE_ALTITUDE);

        cesiumGlobeRef.current.camera.flyTo({
            destination: location,
            duration: 2 // smooth flight duration in seconds
        });
    }


    const update = (field: 'lat' | 'lon', value: string) => {
        setCoords({
            ...coords,
            [field]: parseFloat(value) || 0
        });
    };

    return (
        <div className="observer-input">
            <div className="number-input">
                <div onClick={() => alert("Sorry, can't do that right now")}>
                    <p>Latitude</p>
                    <div className="place-horizontal">
                        <input
                            style={{ pointerEvents: 'none' }}
                            type="number"
                            step="any"
                            value={coords.lat}
                            disabled
                            onChange={(e) => update('lat', (e.target as HTMLInputElement).value)}
                        />
                        <PencilIcon size={16} />
                    </div>
                </div>
                <div onClick={() => alert("Sorry, can't do that right now")}>
                    <p>Longitude</p>
                    <div className="place-horizontal">
                        <input
                            style={{ pointerEvents: 'none' }}
                            type="number"
                            step="any"
                            value={coords.lon}
                            disabled
                            onChange={(e) => update('lon', (e.target as HTMLInputElement).value)}
                        />
                        <PencilIcon size={16} />
                    </div>
                </div>
            </div>


            <button
                className="observer-button"
                onClick={onFly}
                title="Fly to coordinates"
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
                <p>Fly to</p>
                <PinIcon />
            </button>
        </div>
    )
}