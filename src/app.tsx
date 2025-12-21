import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import './app.css'
import { useEffect, useRef } from 'preact/hooks';

export function App() {
  const cesiumRef = useRef(null)
  Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_KEY

  useEffect(() => {
    if (!cesiumRef.current) return

    const viewer = new Viewer(cesiumRef.current, {
      terrain: Terrain.fromWorldTerrain(),
    });

    // Fly the camera to San Francisco at the given longitude, latitude, and height.
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-15.0),
      }
    });

    // Add Cesium OSM Buildings, a global 3D buildings layer.
    (async () => {
      const buildingTileset = await createOsmBuildingsAsync();
      viewer.scene.primitives.add(buildingTileset);
    })();

    return () => {
      viewer.destroy()
    }
  }, [])

  return (
    <div ref={cesiumRef} />
  )
}
