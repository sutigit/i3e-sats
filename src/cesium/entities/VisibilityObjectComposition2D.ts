import {
  Primitive,
  GeometryInstance,
  PolylineGeometry,
  Geometry,
  GeometryAttribute,
  ComponentDatatype,
  PrimitiveType,
  PolylineColorAppearance,
  PerInstanceColorAppearance,
  ColorGeometryInstanceAttribute,
  Cartesian3,
  Color,
  Viewer,
  ArcType,
  BoundingSphere,
  BillboardCollection,
  Ellipsoid,
} from "cesium";

import * as satellite from "satellite.js";
import type { Satellite, VisibilityWindow, LookPoint } from "../../types";

// --- CONFIGURATION ---
const PATH_SAMPLES = 50;
const FAN_COLOR = Color.fromCssColorString("#EDDDD4").withAlpha(0.21);
const PATH_COLOR = Color.fromCssColorString("#EDDDD4");
const PATH_MAX_ALPHA = 0.6;
const BOX_COLOR = "rgba(237, 221, 212,0.2)";
const BOX_OUTLINE_COLOR = "rgba(255,255,255,0.4)";

// --- SHARED ASSETS ---
const createSquareImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = BOX_COLOR;
    ctx.fillRect(0, 0, 24, 24);
    ctx.strokeStyle = BOX_OUTLINE_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 24, 24);
  }
  return canvas.toDataURL();
};
const LOOK_POINT_ICON_URL = createSquareImage();

export class VisibilityObjectComposition2D {
  private _viewer: Viewer;
  private _primitives: Primitive[] = [];
  private _billboards: BillboardCollection; // Now guaranteed to be initialized

  constructor(
    viewer: Viewer,
    sat: Satellite,
    observerLat: number,
    observerLon: number
  ) {
    this._viewer = viewer;

    // FIX: Initialize immediately so it is defined even if we return early
    this._billboards = new BillboardCollection();
    this._viewer.scene.primitives.add(this._billboards);

    const window = this.findBestWindow(sat);

    // Early return is now safe because _billboards exists (it's just empty)
    if (!window) return;

    // 1. Calculate Full Window Path (Projected to Ground)
    const groundPathPositions = this.sampleGroundPath(
      sat.tle,
      window.startTime,
      window.endTime
    );

    // 2. Create Components
    this.createLookBillboards(window.lookPoints);
    this.createStaticPath(groundPathPositions);
    this.createSensorFan(groundPathPositions, observerLat, observerLon);
  }

  private findBestWindow(sat: Satellite): VisibilityWindow | null {
    const windows = sat.visibility.visibilityWindow || [];
    const now = new Date().getTime();

    // Priority 1: Active
    const active = windows.find(
      (w) => w.startTime.getTime() <= now && w.endTime.getTime() >= now
    );
    if (active) return active;

    // Priority 2: Next Future
    return windows.find((w) => w.startTime.getTime() > now) || null;
  }

  /**
   * Propagates TLE and projects every point to GROUND level (Alt = 0)
   */
  private sampleGroundPath(tle: any, start: Date, end: Date): Cartesian3[] {
    const positions: Cartesian3[] = [];

    if (start.getTime() >= end.getTime()) return positions;

    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const startMs = start.getTime();
    const endMs = end.getTime();
    const duration = endMs - startMs;
    const step = duration / PATH_SAMPLES;

    const scratchPos = new Cartesian3();

    for (let i = 0; i <= PATH_SAMPLES; i++) {
      const time = new Date(startMs + step * i);
      const posVel = satellite.propagate(satrec, time);
      const gmst = satellite.gstime(time);

      if (posVel?.position && typeof posVel.position === "object") {
        const pEci = posVel.position as satellite.EciVec3<number>;
        const pEcf = satellite.eciToEcf(pEci, gmst);

        scratchPos.x = pEcf.x * 1000;
        scratchPos.y = pEcf.y * 1000;
        scratchPos.z = pEcf.z * 1000;

        const groundPos = new Cartesian3();
        Ellipsoid.WGS84.scaleToGeodeticSurface(scratchPos, groundPos);

        positions.push(groundPos);
      }
    }
    return positions;
  }

  // --- COMPONENT 1: Look Point Billboards (2D Icons) ---
  private createLookBillboards(lookPoints: LookPoint[]) {
    if (!lookPoints || lookPoints.length === 0) return;

    lookPoints.forEach((lp) => {
      // Convert Location to Cartesian3 (and clamp to ground)
      const rawPos = Cartesian3.fromDegrees(
        lp.location.lon,
        lp.location.lat,
        0
      );

      this._billboards.add({
        image: LOOK_POINT_ICON_URL,
        position: rawPos,
        width: 12,
        height: 12,
        color: Color.WHITE,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    });
  }

  // --- COMPONENT 2: Static Path Polyline ---
  private createStaticPath(positions: Cartesian3[]) {
    if (positions.length < 2) return;

    const colors: Color[] = [];
    const length = positions.length;

    for (let i = 0; i < length; i++) {
      const t = i / (length - 1);

      // 1. Calculate base wave (0 -> 1 -> 0)
      const baseAlpha = Math.sin(t * Math.PI);

      // 2. Scale it by the max desired alpha
      const finalAlpha = baseAlpha * PATH_MAX_ALPHA;

      colors.push(PATH_COLOR.withAlpha(finalAlpha));
    }

    const instance = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: positions,
        width: 1,
        arcType: ArcType.GEODESIC,
        colors: colors,
        colorsPerVertex: true,
      }),
    });

    this.addPrimitive(
      new Primitive({
        geometryInstances: instance,
        appearance: new PolylineColorAppearance({
          translucent: true,
        }),
        asynchronous: false,
      })
    );
  }

  // --- COMPONENT 3: Sensor Fan (Ground Projection) ---
  private createSensorFan(
    pathPositions: Cartesian3[],
    lat: number,
    lon: number
  ) {
    if (pathPositions.length < 2) return;

    const observerPos = Cartesian3.fromDegrees(lon, lat, 0);
    const flatPositions = [observerPos.x, observerPos.y, observerPos.z];

    pathPositions.forEach((p) => {
      flatPositions.push(p.x, p.y, p.z);
    });

    const indices: number[] = [];
    const numPathPoints = pathPositions.length;

    for (let i = 1; i < numPathPoints; i++) {
      indices.push(0);
      indices.push(i);
      indices.push(i + 1);
    }

    const geometry = new Geometry({
      attributes: {
        position: new GeometryAttribute({
          componentDatatype: ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: new Float64Array(flatPositions),
        }),
      } as any,
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
          flat: true,
          translucent: true,
          closed: false,
        }),
        asynchronous: false,
      })
    );
  }

  // --- LIFECYCLE ---
  private addPrimitive(prim: Primitive) {
    this._viewer.scene.primitives.add(prim);
    this._primitives.push(prim);
  }

  public destroy() {
    this._primitives.forEach((p) => {
      this._viewer.scene.primitives.remove(p);
    });
    this._primitives = [];

    // Safely remove billboards
    if (this._billboards && !this._billboards.isDestroyed()) {
      this._viewer.scene.primitives.remove(this._billboards);
    }
  }
}
