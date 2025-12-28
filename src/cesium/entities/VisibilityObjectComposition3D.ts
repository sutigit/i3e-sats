import {
  Primitive,
  GeometryInstance,
  BoxGeometry,
  BoxOutlineGeometry,
  PolylineGeometry,
  Geometry,
  GeometryAttribute,
  ComponentDatatype,
  PrimitiveType,
  PerInstanceColorAppearance,
  PolylineColorAppearance,
  ColorGeometryInstanceAttribute,
  Cartesian3,
  Color,
  Matrix4,
  Viewer,
  ArcType,
  BoundingSphere,
} from "cesium";

import * as satellite from "satellite.js";
import type { Satellite, VisibilityWindow } from "../../types";

// --- CONFIGURATION ---
const PATH_SAMPLES = 50; // Smoothness of the arc/fan
const BOX_SIZE = 50000; // 50km box (same size as sat entity)
const FAN_COLOR = Color.fromCssColorString("#f472b6").withAlpha(0.15); // Cyan-ish, very transparent
const PATH_COLOR = Color.fromCssColorString("#f472b6");

export class VisibilityObjectComposition3D {
  private _viewer: Viewer;
  private _primitives: Primitive[] = [];

  constructor(
    viewer: Viewer,
    sat: Satellite,
    observerLat: number,
    observerLon: number
  ) {
    this._viewer = viewer;

    // 1. Find the relevant window (Active or Next)
    // We reuse the logic from your helpers to find the best window
    const window = this.findBestWindow(sat);

    if (!window) {
      console.log("No visibility window to visualize.");
      return;
    }

    // 2. Pre-calculate the Path Positions (Curve)
    // We must re-propagate because we need the curve, not just start/end points
    const pathPositions = this.samplePath(
      sat.tle,
      window.startTime,
      window.endTime
    );

    // 3. Create the Components
    this.createLookBoxes(window.lookPoints);
    this.createFadedPath(pathPositions);
    this.createSensorFan(pathPositions, observerLat, observerLon);
  }

  /**
   * Helper to find the Active or Next window
   */
  private findBestWindow(sat: Satellite): VisibilityWindow | null {
    const windows = sat.visibility.visibilityWindow || [];
    const now = new Date().getTime();

    // Priority 1: Active
    const active = windows.find(
      (w) => w.startTime.getTime() <= now && w.endTime.getTime() >= now
    );
    if (active) return active;

    // Priority 2: Next Future
    // Assuming windows are sorted, find first one in future
    return windows.find((w) => w.startTime.getTime() > now) || null;
  }

  /**
   * Propagates TLE to get smooth arc positions
   */
  private samplePath(tle: any, start: Date, end: Date): Cartesian3[] {
    const positions: Cartesian3[] = [];
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const startMs = start.getTime();
    const endMs = end.getTime();
    const duration = endMs - startMs;
    const step = duration / PATH_SAMPLES;

    for (let i = 0; i <= PATH_SAMPLES; i++) {
      const time = new Date(startMs + step * i);
      const posVel = satellite.propagate(satrec, time);
      const gmst = satellite.gstime(time);

      if (posVel?.position && typeof posVel.position === "object") {
        const pEci = posVel.position as satellite.EciVec3<number>;
        const pEcf = satellite.eciToEcf(pEci, gmst);
        positions.push(
          new Cartesian3(pEcf.x * 1000, pEcf.y * 1000, pEcf.z * 1000)
        );
      }
    }
    return positions;
  }

  // --- COMPONENT 1: Look Point Boxes ---
  private createLookBoxes(lookPoints: any[]) {
    if (!lookPoints || lookPoints.length === 0) return;

    const fillInstances: GeometryInstance[] = [];
    const outlineInstances: GeometryInstance[] = [];

    const fillGeom = new BoxGeometry({
      maximum: new Cartesian3(BOX_SIZE / 2, BOX_SIZE / 2, BOX_SIZE / 2),
      minimum: new Cartesian3(-BOX_SIZE / 2, -BOX_SIZE / 2, -BOX_SIZE / 2),
    });

    const outlineGeom = new BoxOutlineGeometry({
      maximum: new Cartesian3(BOX_SIZE / 2, BOX_SIZE / 2, BOX_SIZE / 2),
      minimum: new Cartesian3(-BOX_SIZE / 2, -BOX_SIZE / 2, -BOX_SIZE / 2),
    });

    lookPoints.forEach((lp) => {
      // Convert Location -> Cartesian3
      const position = Cartesian3.fromDegrees(
        lp.location.lon,
        lp.location.lat,
        lp.location.alt * 1000
      );
      const modelMatrix = Matrix4.fromTranslation(position);

      fillInstances.push(
        new GeometryInstance({
          geometry: fillGeom,
          modelMatrix: modelMatrix,
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(
              Color.fromCssColorString("#f472b6").withAlpha(0.4)
            ),
          },
        })
      );

      outlineInstances.push(
        new GeometryInstance({
          geometry: outlineGeom,
          modelMatrix: modelMatrix,
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(
              Color.fromCssColorString("#fbcfe8")
            ),
          },
        })
      );
    });

    // Batch Add
    this.addPrimitive(
      new Primitive({
        geometryInstances: fillInstances,
        appearance: new PerInstanceColorAppearance({
          flat: true,
          translucent: true,
        }),
        asynchronous: false,
      })
    );

    this.addPrimitive(
      new Primitive({
        geometryInstances: outlineInstances,
        appearance: new PerInstanceColorAppearance({
          flat: true,
          translucent: true,
        }),
        asynchronous: false,
      })
    );
  }

  // --- COMPONENT 2: Faded Path Polyline ---
  private createFadedPath(positions: Cartesian3[]) {
    if (positions.length < 2) return;

    const colors: Color[] = [];
    const length = positions.length;

    // Create Fade In/Out Gradient
    for (let i = 0; i < length; i++) {
      // Normalized time 0 -> 1
      const t = i / (length - 1);
      // Sine wave for alpha: 0 at start, 1 at middle, 0 at end
      const alpha = Math.sin(t * Math.PI);
      colors.push(PATH_COLOR.withAlpha(alpha));
    }

    const instance = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: positions,
        width: 2,
        colors: colors,
        colorsPerVertex: true,
        arcType: ArcType.NONE, // Straight lines between samples (smooth enough with 50 samples)
      }),
    });

    this.addPrimitive(
      new Primitive({
        geometryInstances: instance,
        appearance: new PolylineColorAppearance({ translucent: true }),
        asynchronous: false,
      })
    );
  }

  // --- COMPONENT 3: Sensor Fan (Triangle Mesh) ---
  private createSensorFan(
    pathPositions: Cartesian3[],
    lat: number,
    lon: number
  ) {
    if (pathPositions.length < 2) return;

    const observerPos = Cartesian3.fromDegrees(lon, lat, 0); // Ground level

    // 1. Flatten positions into a single array: [ObsX, ObsY, ObsZ, P0x, P0y, P0z, P1x...]
    // We start with the Observer (Vertex 0)
    const flatPositions = [observerPos.x, observerPos.y, observerPos.z];

    pathPositions.forEach((p) => {
      flatPositions.push(p.x, p.y, p.z);
    });

    // 2. Build Indices for a Triangle Fan
    // Vertices in flatPositions:
    // Index 0: Observer
    // Index 1: PathPoint[0]
    // Index 2: PathPoint[1]
    // ...

    const indices: number[] = [];
    const numPathPoints = pathPositions.length;

    // We loop through the path points to create triangles.
    // We need at least 2 path points to make 1 triangle (Obs -> P0 -> P1)
    // The loop goes from 1 up to (N-1)
    for (let i = 1; i < numPathPoints; i++) {
      indices.push(0); // Vertex 0 (Observer)
      indices.push(i); // Vertex i (Current Point)
      indices.push(i + 1); // Vertex i+1 (Next Point)
    }

    const geometry = new Geometry({
      attributes: {
        position: new GeometryAttribute({
          componentDatatype: ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: new Float64Array(flatPositions),
        }),
      } as any, // Cast to 'any' to suppress TS error about missing Normals/Tangents

      indices: new Uint16Array(indices),
      primitiveType: PrimitiveType.TRIANGLES,
      boundingSphere: BoundingSphere.fromVertices(flatPositions),
    });

    const instance = new GeometryInstance({
      geometry: geometry,
      attributes: {
        color: ColorGeometryInstanceAttribute.fromColor(FAN_COLOR),
      },
    });

    this.addPrimitive(
      new Primitive({
        geometryInstances: instance,
        appearance: new PerInstanceColorAppearance({
          flat: true, // No lighting/shadows (saves performance, doesn't need normals)
          translucent: true,
          closed: false, // Single sided mesh
        }),
        asynchronous: false,
      })
    );
  }

  // --- LIFECYCLE HELPER ---
  private addPrimitive(prim: Primitive) {
    this._viewer.scene.primitives.add(prim);
    this._primitives.push(prim);
  }

  public destroy() {
    this._primitives.forEach((p) => {
      this._viewer.scene.primitives.remove(p);
    });
    this._primitives = [];
  }
}
