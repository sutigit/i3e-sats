import { Cartesian3, Color, Entity, Math as CesiumMath, GeometryInstance, PolylineGeometry, ArcType, Primitive, PolylineColorAppearance, HeadingPitchRoll, HeightReference } from "cesium";
import { satelliteSVG } from "./icons";
import type { ObserverDrawEntity, PathDrawEntity, PointDrawEntity } from "../types";
const SATELLITE_ICON = satelliteSVG;

/**
 * Renders a trajectory path in the Cesium viewer.
 */
export const drawPath = ({ id, path, viewer, mode }: PathDrawEntity): void => {
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
                id,
                geometry: new PolylineGeometry({
                    positions: path,
                    colors: colors,        // Vertex colors enable the gradient
                    width: 1.0,
                    colorsPerVertex: true,
                    arcType: ArcType.NONE  // Linear interpolation (fastest for dense arrays)
                })
            }),
            appearance: new PolylineColorAppearance({ translucent: true }),
        }));
    }

    // --- MODE: GROUND (Solid Clamp) ---
    else {
        viewer.entities.add({
            id,
            polyline: {
                positions: path,
                width: 2.0,
                material: baseColor.withAlpha(0.6),
                clampToGround: true
            }
        });
    }
}

/**
 * Renders a multi-color trail.
 */
export const drawTrail = ({ id, path, viewer, mode }: PathDrawEntity): void => {
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
                id,
                geometry: new PolylineGeometry({
                    positions: path,
                    colors: colors,        // The gradient array
                    width: 1.2,
                    colorsPerVertex: true, // Required for gradient
                    arcType: ArcType.NONE
                })
            }),
            appearance: new PolylineColorAppearance({ translucent: true }),
        }));
    }

    // --- MODE: GROUND (Solid Head Color) ---
    else {
        const solidColor = Color.fromCssColorString('#ea580c');
        viewer.entities.add({
            id,
            polyline: {
                positions: path,
                width: 2.0,
                material: solidColor.withAlpha(0.7),
                clampToGround: true // Handles all the terrain intersection logic for you
            }
        });
    }
}

/**
 * Renders a satellite point in the Cesium viewer.
 */
export const drawPoint = ({ id, position, orientation, viewer, mode }: PointDrawEntity): void => {

    // --- MODE: SPACE (3D Box) ---
    if (mode === "space") {
        viewer.entities.add(new Entity({
            id,
            position,
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
            id,
            position,
            billboard: {
                image: SATELLITE_ICON,
                width: 14,
                height: 14,
                rotation: rotation,
                heightReference: HeightReference.CLAMP_TO_GROUND,

                // Locks the rotation to the map surface (Compass behavior)
                // instead of the screen (Spinning icon behavior)
                alignedAxis: Cartesian3.normalize(position, new Cartesian3()),

            }
        }));
    }
}

/**
 * Renders the observer point in the Cesium viewer.
 */
export const drawObserver = ({ id, position, viewer }: ObserverDrawEntity): void => {
    const ent = new Entity({
        id,
        position: position,
        point: {
            pixelSize: 12,
            color: Color.fromCssColorString('#f9a8d4'),
        }
    });

    viewer.entities.add(ent);
}