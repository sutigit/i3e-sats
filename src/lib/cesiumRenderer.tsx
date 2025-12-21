import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { RefObject } from 'preact';

const CESIUM_KEY = import.meta.env.VITE_CESIUM_KEY
if (!CESIUM_KEY) console.log("📌 Missing cesium api key")

Ion.defaultAccessToken = CESIUM_KEY
const coords = {
    "otaniemi": { lon: 24.83, lat: 60.18 }
}

export const cesiumView = (cesiumRef: RefObject<HTMLDivElement>) => {
    if (!cesiumRef.current) {
        throw new Error('Cesium container ref is not attached to a DOM element');
    }

    const viewer = new Viewer(cesiumRef.current, {
        terrain: Terrain.fromWorldTerrain(),
    });

    viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(coords["otaniemi"].lon, coords["otaniemi"].lat, 40000000.0),
        orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-90.0),
            roll: CesiumMath.toRadians(0.0)
        },
    });

    (async () => {
        try {
            const buildingTileset = await createOsmBuildingsAsync();
            if (!viewer.isDestroyed()) {
                viewer.scene.primitives.add(buildingTileset);
            }
        } catch {
            console.error('Error loading cesium')
        }
    })();

    return viewer
}