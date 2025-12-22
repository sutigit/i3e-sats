import { ArcType, Cartesian3, Color, Entity, GeometryInstance, HeadingPitchRoll, Math as CesiumMath, PolylineColorAppearance, PolylineGeometry, Primitive, Transforms, Viewer } from "cesium";
import { getSatelliteInfo, type SatelliteInfoOutput, type Timestamp } from "tle.js";
import type { TLE } from "../../types";

const _infoToCartesian3 = (info: SatelliteInfoOutput) => {
    return Cartesian3.fromDegrees(
                info.lng,
                info.lat,
                info.height * 1000 // km to meters
            );
}

const _getOrbitPath = (tleLine: TLE["tle"], now: Timestamp, lastMins: number = 97): Cartesian3[] => {
    const positions: Cartesian3[] = [];
    const stepInMinutes = 1;
    const durationMinutes = lastMins; // // default 97 min ICEYE satellite approximate orbit duration

    for (let i = -durationMinutes; i <= 0; i += stepInMinutes) {
        const timestamp = now + (i * 60000); // i is negative, so this subtracts time
        const info = getSatelliteInfo(tleLine, timestamp);

        if (info && info.height) {

            if (info.height < 100) {
                console.warn("⚠️ Satellite is crashing!", info.height);
            }

            const pos = _infoToCartesian3(info)
            positions.push(pos);
        }
    }
    return positions;
}

const _getOrbitPoint = (tleLine: TLE["tle"], now: Timestamp): Cartesian3 => {
    const info = getSatelliteInfo(tleLine, now);
    return _infoToCartesian3(info)
}

const _drawPath = (path: Cartesian3[], viewer: Viewer) => {
    if (!path || path.length < 2) return;

    // --- Config ---
    const baseColor = Color.fromCssColorString("#2dd4bf"); // Teal
    const maxAlpha = 0.3; // Opacity at the "Head" (0.0 to 1.0)

    const colors: Color[] = [];
    const len = path.length;

    // --- Step 1: Compute Per-Vertex Alpha ---
    for (let i = 0; i < len; i++) {
        // Normalized progress: 0.0 (Tail) -> 1.0 (Head)
        const t = i / (len - 1);

        // Linear fade: Tail starts at 0, Head ends at maxAlpha
        // You can use t * t for a non-linear "fast fade"
        const alpha = t * maxAlpha;

        // Same color, changing alpha
        colors.push(Color.fromAlpha(baseColor, alpha));
    }

    // --- Step 2: Render Primitive ---
    const instance = new GeometryInstance({
        geometry: new PolylineGeometry({
            positions: path,
            width: 1.0,            // Constant width (no tapering)
            colors: colors,        // Alpha gradient array
            colorsPerVertex: true, // Enable blending
            arcType: ArcType.NONE
        })
    });

    viewer.scene.primitives.add(new Primitive({
        geometryInstances: instance,
        // appearance must be PolylineColorAppearance to read the 'colors' array
        appearance: new PolylineColorAppearance({
            translucent: true
        }),
        asynchronous: false
    }));
}

const _drawTrail = (path: Cartesian3[], viewer: Viewer) => {
    if (!path || path.length < 2) return;

    // --- Config: Gradient Palette (Tail -> Head) ---
    const rawColors = ["#7c3aed", "#0284c7", "#059669", "#ca8a04", "#dc2626"];
    const palette = rawColors.map(c => Color.fromCssColorString(c));
    const maxIdx = palette.length - 1;

    const colors: Color[] = [];
    const len = path.length;

    // --- Step 1: Compute Per-Vertex Colors ---
    for (let i = 0; i < len; i++) {
        const t = i / (len - 1); // Normalized progress (0.0 -> 1.0)

        // Map t to palette indices (e.g., 0.5 -> blend(palette[2], palette[3]))
        const scaledT = t * maxIdx;
        const idx1 = Math.floor(scaledT);
        const idx2 = Math.min(idx1 + 1, maxIdx);

        // Lerp RGB based on local segment progress
        const rgb = Color.lerp(palette[idx1], palette[idx2], scaledT - idx1, new Color());

        // Lerp Alpha: Tail (0.0) -> Head (1.0) for "comet" fade
        colors.push(Color.fromAlpha(rgb, t));
    }

    // --- Step 2: Render via Primitive API (Performance) ---
    // Primitives are lighter than Entities for geometry with per-vertex attributes
    const instance = new GeometryInstance({
        geometry: new PolylineGeometry({
            positions: path,
            width: 1.2,
            colors: colors,        // Vertex color array (must match positions length)
            colorsPerVertex: true, // triggers varying vec4 in shader
            arcType: ArcType.NONE  // CRITICAL: prevents crash on tiny segments / pole crossings
        })
    });

    viewer.scene.primitives.add(new Primitive({
        geometryInstances: instance,
        appearance: new PolylineColorAppearance({ translucent: true }),
        asynchronous: false // Force sync render to avoid popping
    }));
}

const _drawPoint = (point: Cartesian3, viewer: Viewer ) => {
// 1. CALCULATE ORIENTATION
    // This creates a rotation that aligns the object with "East-North-Up"
    // Result: Local Z is Up (Space), Local -Z is Down (Earth Center)
    const orientation = Transforms.headingPitchRollQuaternion(
        point, 
        new HeadingPitchRoll(
            CesiumMath.toRadians(0), // Heading (Rotation around Up)
            CesiumMath.toRadians(0), // Pitch (Tilt forward/back)
            CesiumMath.toRadians(0)  // Roll (Tilt left/right)
        )
    );

    const ent = new Entity({
        position: point,
        
        // 2. APPLY ROTATION
        orientation: orientation, 

        box: {
            dimensions: new Cartesian3(50000.0, 50000.0, 50000.0),
            material: Color.fromCssColorString("#5eead4").withAlpha(0.3),
            outline: true,
            outlineColor: Color.fromCssColorString("#ccfbf1"),
            outlineWidth: 1,
        }
    })

    viewer.entities.add(ent)
}

export const addPaths = ({ data, viewer }: { data: TLE[] | undefined, viewer: Viewer }) => {
    if (!data) return
    data.forEach((d: TLE) => {
        const path = _getOrbitPath(d.tle, Date.now())
        _drawPath(path, viewer)
    })
}

export const addTrails = ({ data, viewer }: { data: TLE[] | undefined, viewer: Viewer }) => {
    if (!data) return
    data.forEach((d: TLE) => {
        const path = _getOrbitPath(d.tle, Date.now(), 10)
        _drawTrail(path, viewer)
    })
}

export const addPoints = ({ data, viewer }: { data: TLE[] | undefined, viewer: Viewer }) => {
    if (!data) return
    data.forEach((d: TLE) => {
        const path = _getOrbitPoint(d.tle, Date.now())
        _drawPoint(path, viewer)
    })
}