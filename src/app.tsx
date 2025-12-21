import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './app.css'
import { useEffect, useRef } from 'preact/hooks';

const CESIUM_KEY = import.meta.env.VITE_CESIUM_KEY
if (!CESIUM_KEY) console.log("📌 Missing cesium api key")

Ion.defaultAccessToken = CESIUM_KEY

export function App() {
  const cesiumRef = useRef(null)

  useEffect(() => {
    if (!cesiumRef.current) return

    const viewer = new Viewer(cesiumRef.current, {
      terrain: Terrain.fromWorldTerrain(),
    });

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-15.0),
      }
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

    return () => {
      viewer.destroy()
    }
  }, [])

  return (
    <div ref={cesiumRef} id='cesium-view' />
  )
}
