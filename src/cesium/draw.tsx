import { Cartesian3, Color, Entity, type Viewer, Math as CesiumMath, GeometryInstance, PolylineGeometry, ArcType, Primitive, PolylineColorAppearance, Quaternion, GroundPolylinePrimitive, GroundPolylineGeometry, ColorGeometryInstanceAttribute, HeadingPitchRoll, HeightReference } from "cesium";
import { satelliteSVG } from "./icons";
const SATELLITE_ICON = satelliteSVG;

/**
 * Renders a trajectory path in the Cesium viewer.
 */
export const drawPath = (path: Cartesian3[], viewer: Viewer, mode: "space" | "ground") => {
    if (!path || path.length < 2) return;

    const baseColor = Color.fromCssColorString("#2dd4bf");

    // --- MODE: SPACE (Gradient Fade) ---
    if (mode === "space") {
        const colors: Color[] = [];
        const len = path.length;
        const maxAlpha = 0.3;

        // Compute per-vertex alpha for trail effect (Tail=0.0 -> Head=0.4)
        for (let i = 0; i < len; i++) {
            colors.push(Color.fromAlpha(baseColor, (i / (len - 1)) * maxAlpha));
        }

        viewer.scene.primitives.add(new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: new PolylineGeometry({
                    positions: path,
                    width: 1.0,
                    colors: colors,        // Vertex colors enable the gradient
                    colorsPerVertex: true,
                    arcType: ArcType.NONE  // Linear interpolation (fastest for dense arrays)
                })
            }),
            appearance: new PolylineColorAppearance({ translucent: true }),
            asynchronous: false // Draw immediately (avoids pop-in)
        }));
    }

    // --- MODE: GROUND (Solid Clamp) ---
    else {
        viewer.scene.groundPrimitives.add(new GroundPolylinePrimitive({
            geometryInstances: new GeometryInstance({
                geometry: new GroundPolylineGeometry({
                    positions: path,
                    width: 2.0, // Thicker to mitigate z-fighting/texture noise
                }),
                attributes: {
                    // Ground primitives require attributes for color, no vertex support
                    color: ColorGeometryInstanceAttribute.fromColor(baseColor.withAlpha(0.6))
                }
            }),
            appearance: new PolylineColorAppearance({ translucent: true }),
            asynchronous: false
        }));
    }
}

/**
 * Renders a multi-color trail.
 */
export const drawTrail = (path: Cartesian3[], viewer: Viewer, mode: "space" | "ground") => {
    if (!path || path.length < 2) return;

    // --- Config: Gradient Palette (Tail -> Head) ---
    const rawColors = ["#7c3aed", "#0284c7", "#059669", "#ca8a04", "#dc2626"];
    const palette = rawColors.map(c => Color.fromCssColorString(c));

    // --- MODE: SPACE (Gradient Rainbow) ---
    if (mode === "space") {
        const colors: Color[] = [];
        const len = path.length;
        const maxIdx = palette.length - 1;

        // Compute Per-Vertex Colors
        for (let i = 0; i < len; i++) {
            const t = i / (len - 1); // 0.0 -> 1.0

            // Map t to palette indices
            const scaledT = t * maxIdx;
            const idx1 = Math.floor(scaledT);
            const idx2 = Math.min(idx1 + 1, maxIdx);

            // Lerp RGB
            const rgb = Color.lerp(palette[idx1], palette[idx2], scaledT - idx1, new Color());

            // Lerp Alpha (Tail=0.0 -> Head=1.0)
            colors.push(Color.fromAlpha(rgb, t));
        }

        viewer.scene.primitives.add(new Primitive({
            geometryInstances: new GeometryInstance({
                geometry: new PolylineGeometry({
                    positions: path,
                    width: 1.2,
                    colors: colors,        // The gradient array
                    colorsPerVertex: true, // Required for gradient
                    arcType: ArcType.NONE
                })
            }),
            appearance: new PolylineColorAppearance({ translucent: true }),
            asynchronous: false
        }));
    }

    // --- MODE: GROUND (Solid Head Color) ---
    else {
        // We use the "Head" color (last in palette) for maximum visibility
        const solidColor = palette[palette.length - 1];

        viewer.scene.groundPrimitives.add(new GroundPolylinePrimitive({
            geometryInstances: new GeometryInstance({
                geometry: new GroundPolylineGeometry({
                    positions: path,
                    width: 4.0, // Thicker for ground visibility
                }),
                attributes: {
                    // Ground lines do not support vertex arrays, so we use a single color attribute
                    color: ColorGeometryInstanceAttribute.fromColor(solidColor.withAlpha(0.8))
                }
            }),
            appearance: new PolylineColorAppearance({ translucent: true }),
            asynchronous: false
        }));
    }
}

/**
 * Renders a satellite point in the Cesium viewer.
 */
export const drawPoint = (
    point: Cartesian3,
    orientation: Quaternion,
    viewer: Viewer,
    mode: "space" | "ground"
) => {

    // --- MODE: SPACE (3D Box) ---
    if (mode === "space") {
        viewer.entities.add(new Entity({
            position: point,
            orientation: orientation,
            box: {
                dimensions: new Cartesian3(50000.0, 50000.0, 50000.0),
                material: Color.fromCssColorString("#5eead4").withAlpha(0.3),
                outline: true,
                outlineColor: Color.fromCssColorString("#ccfbf1"),
            }
        }));
    }

    // --- MODE: GROUND (SVG Billboard) ---
    else {
        // Calculate Rotation
        const hpr = HeadingPitchRoll.fromQuaternion(orientation);
        // We negate the heading because Cesium rotates Billboards Counter-Clockwise
        // But Compass Heading is Clockwise.
        const rotation = -hpr.heading + CesiumMath.PI_OVER_TWO;

        viewer.entities.add(new Entity({
            position: point,
            billboard: {
                image: SATELLITE_ICON,
                width: 16,
                height: 16,

                rotation: rotation,
                // Locks the rotation to the map surface (Compass behavior)
                // instead of the screen (Spinning icon behavior)
                alignedAxis: Cartesian3.normalize(point, new Cartesian3()),

                heightReference: HeightReference.CLAMP_TO_GROUND,
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        }));
    }
}

/**
 * Renders the observer point in the Cesium viewer.
 */
export const drawObserver = (point: Cartesian3, viewer: Viewer) => {
    const ent = new Entity({
        position: point,
        point: {
            pixelSize: 12,
            color: Color.fromCssColorString('#f9a8d4'),
        }
    });

    viewer.entities.add(ent);
}