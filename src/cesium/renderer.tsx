import { Cartesian3, Ion, Math as CesiumMath, Viewer, Color } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { RefObject } from 'preact';

const CESIUM_KEY = import.meta.env.VITE_CESIUM_KEY
if (!CESIUM_KEY) console.warn("📌 Missing cesium api key")

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

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

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
            webgl: {
                alpha: true, // make css background visible
                powerPreference: "high-performance"
            }
        },

        // Hide credits for minimap view
        creditContainer: view.minimap ? document.createElement('div') : undefined
    });

    // --- IMAGERY OPTIONS (ICEYE SAR style) --- 
    const layer = viewer.scene.imageryLayers.get(0)

    if (view.minimap) {
        // Lock Panning (User cannot drag the map)
        viewer.scene.screenSpaceCameraController.enableTranslate = false;
        viewer.scene.screenSpaceCameraController.enableRotate = false;
        viewer.scene.screenSpaceCameraController.enableTilt = false;
        viewer.scene.screenSpaceCameraController.enableLook = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        // Clamp Zoom (Meters)
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 10000;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 1000000;

        // Resolution
        viewer.scene.globe.maximumScreenSpaceError = isMobile ? 2 : 1; // default 2

        // Aesthetics
        layer.saturation = 0.1;
        layer.alpha = 0.6;
        layer.contrast = 1.0;
        layer.brightness = 1.0;
        layer.gamma = 1.2;
    } else {
        // Clamp Zoom globe (Meters)
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000000;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 50000000;

        // Resolution
        viewer.scene.globe.maximumScreenSpaceError = isMobile ? 3 : 2; // default 2

        // Aesthetics
        layer.saturation = 0.1;
        layer.alpha = 0.6;
        layer.contrast = 1.5;
        layer.brightness = 0.4;
        layer.gamma = 1.4;
    }

    // Atmosphere
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

    // --- FORCE ANIMATION ON ---
    // Since we hid the UI controls (animation = false), we must programmatically start the animation clock.
    viewer.clock.shouldAnimate = true;

    // Debug: Speed up time so movement is visible immediately 
    // (Satellites at 1x speed look like they are standing still)
    // viewer.clock.multiplier = 10;

    // Lock Rendering to ~30 FPS
    // This tells Cesium: "Don't try to render more often than this."
    // It frees up the CPU to finish calculations without choking.
    if (isMobile) {
        viewer.targetFrameRate = 30;
    }

    // Optional: Disable "Request Render Mode" if it's on
    // (It's off by default, but ensures the loop runs steadily at your target rate)
    // viewer.scene.requestRenderMode = false;

    return viewer;
}