import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { RefObject } from 'preact';

const CESIUM_KEY = import.meta.env.VITE_CESIUM_KEY
if (!CESIUM_KEY) console.log("📌 Missing cesium api key")

Ion.defaultAccessToken = CESIUM_KEY


export const cesiumView = (cesiumRef: RefObject<HTMLDivElement>, initView: { lon: number, lat: number, height: number }) => {
    if (!cesiumRef.current) {
        throw new Error('Cesium container ref is not attached to a DOM element');
    }

    const viewer = new Viewer(cesiumRef.current, {
        terrain: Terrain.fromWorldTerrain(),
        scene3DOnly: true,
        terrainProvider: undefined,

        // 1. The Time Controls (Bottom)
        timeline: false,
        animation: false,

        // 2. The Navigation & Map Tools (Top Right)
        geocoder: false,           // Search bar
        homeButton: false,         // Home icon
        baseLayerPicker: false,    // Map chooser
        sceneModePicker: false,    // 2D/3D switcher
        navigationHelpButton: false, // Question mark icon
        fullscreenButton: false,
        vrButton: false,

        // 3. The Selection UI (Popups & Green Boxes)
        selectionIndicator: false, // The green square when you click something
        infoBox: false,            // The side panel description popup
    });

    viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(initView.lon, initView.lat, initView.height),
        orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-90.0),
            roll: CesiumMath.toRadians(0.0)
        },
    });

    viewer.scene.debugShowFramesPerSecond = true;
    // viewer.scene.requestRenderMode = true; // renders only on change

    viewer.scene.globe.maximumScreenSpaceError = 2; // default 2
    viewer.resolutionScale = 1; // default 1

    viewer.scene.fog.enabled = false; // fog
    // viewer.scene.globe.showGroundAtmosphere = false; // "blue haze" around planet
    viewer.scene.skyAtmosphere = undefined; // planets outer glow
    viewer.shadows = false; // shadow (heavy)

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