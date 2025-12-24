import { Cartesian3, Ion, Math as CesiumMath, Viewer, Color } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { RefObject } from 'preact';

const CESIUM_KEY = import.meta.env.VITE_CESIUM_KEY
if (!CESIUM_KEY) console.log("📌 Missing cesium api key")

Ion.defaultAccessToken = CESIUM_KEY

export const cesiumView = (
    cesiumRef: RefObject<HTMLDivElement>,
    view: {
        lon: number,
        lat: number,
        height: number,
        flyTo?: boolean,
        radar?: boolean,
    }) => {

    if (!cesiumRef.current) {
        throw new Error('Cesium container ref is not attached to a DOM element');
    }

    const viewer = new Viewer(cesiumRef.current, {
        terrainProvider: undefined,
        scene3DOnly: true,
        baseLayerPicker: false,

        // UI Toggles
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        vrButton: false,
        selectionIndicator: false,
        infoBox: false,

        // Visuals
        skyBox: false,
        skyAtmosphere: false,
        contextOptions: {
            webgl: { alpha: true } // make css background visible
        },

        // Hide credits for radar view
        creditContainer: view.radar ? document.createElement('div') : undefined
    });

    viewer.scene.debugShowFramesPerSecond = false; // debugging

    viewer.scene.globe.maximumScreenSpaceError = 1; // default 2
    viewer.resolutionScale = 1; // default 1

    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.atmosphereBrightnessShift = -0.2;
    viewer.scene.globe.enableLighting = false;
    viewer.shadows = false;

    // 3. Fog settings (Now that atmosphere is on, fog behaves better)
    viewer.scene.fog.enabled = false;
    viewer.scene.fog.density = 0.0002; // Subtle depth


    // Set colors to Dark/Black
    viewer.scene.backgroundColor = Color.fromCssColorString('#0c1214');
    viewer.scene.globe.baseColor = Color.fromCssColorString('#0f766e');

    // Hide Sun/Moon
    if (viewer.scene.sun) viewer.scene.sun.show = false;
    if (viewer.scene.moon) viewer.scene.moon.show = false;


    // --- IMAGERY OPTIONS (ICEYE SAR style) --- 
    const layer = viewer.scene.imageryLayers.get(0)

    layer.saturation = 0.1;
    layer.alpha = view.radar ? 0.6 : 0.6;
    layer.contrast = view.radar ? 1.0 : 1.5;
    layer.brightness = view.radar ? 1.0 : 0.4;
    layer.gamma = view.radar ? 1.2 : 1.4;

    // --- CAMERA & SCENE SETTINGS ---
    const viewConfig = {
        destination: Cartesian3.fromDegrees(view.lon, view.lat, view.height), // otaniemi
        orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-90.0),
            roll: CesiumMath.toRadians(0.0)
        },
    }

    view.flyTo ? viewer.camera.flyTo(viewConfig) : viewer.camera.setView(viewConfig);

    return viewer;
}