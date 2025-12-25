import { Cartesian3, Color, Entity, type Viewer, GeometryInstance, PolylineGeometry, ArcType, Primitive, PolylineColorAppearance, Quaternion, GroundPolylinePrimitive, GroundPolylineGeometry, ColorGeometryInstanceAttribute } from "cesium";

/**
 * Renders a trajectory path in the Cesium viewer.
 * * Modes:
 * - "space":  Standard `Primitive`. Uses per-vertex alpha to create a "comet tail" fade. High performance.
 * - "ground": `GroundPolylinePrimitive`. Clamps solid line to terrain/globe. Heavier init, optimized for zoom.
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

export const drawTrail = (path: Cartesian3[], viewer: Viewer) => {
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

export const drawPoint = (point: Cartesian3, orientation: Quaternion, viewer: Viewer) => {
    const ent = new Entity({
        position: point,
        orientation,

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