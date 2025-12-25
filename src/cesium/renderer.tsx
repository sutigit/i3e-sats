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
        alt: number,
        minimap?: boolean,
    }) => {

    if (!cesiumRef.current) {
        throw new Error('Cesium container ref is not attached to a DOM element');
    }

    const viewer = new Viewer(cesiumRef.current, {

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
        terrainProvider: undefined,
        scene3DOnly: true,
        baseLayerPicker: false,
        skyBox: false,
        skyAtmosphere: false,
        contextOptions: {
            webgl: { alpha: true } // make css background visible
        },

        // Hide credits for minimap view
        creditContainer: view.minimap ? document.createElement('div') : undefined
    });


    // Lock Panning (User cannot drag the map)
    viewer.scene.screenSpaceCameraController.enableTranslate = !view.minimap;
    viewer.scene.screenSpaceCameraController.enableRotate = !view.minimap;
    viewer.scene.screenSpaceCameraController.enableTilt = !view.minimap;
    viewer.scene.screenSpaceCameraController.enableLook = !view.minimap;
    viewer.scene.screenSpaceCameraController.enableZoom = !view.minimap;

    // Clamp Zoom (Meters)
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = !view.minimap ? 1000000 : 10000;
    viewer.scene.screenSpaceCameraController.maximumZoomDistance = !view.minimap ? 50000000 : 1000000;

    // Debugging
    viewer.scene.debugShowFramesPerSecond = false;

    // Resolution
    viewer.scene.globe.maximumScreenSpaceError = view.minimap ? 1 : 2; // default 2
    viewer.resolutionScale = 1; // default 1

    // Atmosphere
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.globe.atmosphereBrightnessShift = -0.2;
    viewer.scene.globe.enableLighting = false;
    viewer.shadows = false;

    // Fog settings (If atmosphere is on, fog behaves better)
    viewer.scene.fog.enabled = false;
    viewer.scene.fog.density = 0.0002; // Subtle depth

    // Colors
    viewer.scene.backgroundColor = Color.fromCssColorString('#0c1214');
    viewer.scene.globe.baseColor = Color.fromCssColorString('#0f766e');

    // Hide Sun/Moon
    if (viewer.scene.sun) viewer.scene.sun.show = false;
    if (viewer.scene.moon) viewer.scene.moon.show = false;


    // --- IMAGERY OPTIONS (ICEYE SAR style) --- 
    const layer = viewer.scene.imageryLayers.get(0)

    layer.saturation = 0.1;
    layer.alpha = view.minimap ? 0.6 : 0.6;
    layer.contrast = view.minimap ? 1.0 : 1.5;
    layer.brightness = view.minimap ? 1.0 : 0.4;
    layer.gamma = view.minimap ? 1.2 : 1.4;

    // --- CAMERA & SCENE SETTINGS ---
    const viewConfig = {
        destination: Cartesian3.fromDegrees(view.lon, view.lat, view.alt), // otaniemi
        orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-90.0),
            roll: CesiumMath.toRadians(0.0)
        },
    }
    viewer.camera.setView(viewConfig);

    return viewer;
}