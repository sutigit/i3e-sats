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
  Matrix3,
  Viewer,
  ArcType,
  BoundingSphere,
} from "cesium";

import * as satellite from "satellite.js";
import type { Satellite, VisibilityWindow, LookPoint } from "../../types";

const PATH_SAMPLES = 160;
const BOX_SIZE = 50000;
const FAN_COLOR = Color.fromCssColorString("#EDDDD4").withAlpha(0.2);
const PATH_COLOR = Color.fromCssColorString("#EDDDD4");
const PATH_MAX_ALPHA = 0.5;
const BOX_COLOR = Color.fromCssColorString("#EDDDD4").withAlpha(0.2);
const BOX_OUTLINE_COLOR = Color.fromCssColorString("#ffffff").withAlpha(0.2);
const EXTENSION_MINUTES = 3; // How long the tail extends past the visibility window
const EXTENSION_MS = EXTENSION_MINUTES * 60 * 1000;

export class VisibilityObjectComposition3D {
  private _viewer: Viewer;
  private _primitives: Primitive[] = [];

  // Scratch variables
  private _scratchUp = new Cartesian3();
  private _scratchRight = new Cartesian3();
  private _scratchForward = new Cartesian3();
  private _scratchRotation = new Matrix3();
  private _scratchMatrix = new Matrix4();

  constructor(
    viewer: Viewer,
    sat: Satellite,
    observerLat: number,
    observerLon: number
  ) {
    this._viewer = viewer;

    const window = this.findBestWindow(sat);
    if (!window) return;

    const now = new Date();

    // Full Window Path
    const fullWindowPositions = this.samplePath(
      sat.tle,
      window.startTime,
      window.endTime
    );

    // Active Path with Extension (Trajectory)
    const lineEndTime = new Date(window.endTime.getTime() + EXTENSION_MS);

    const activePathPositions = this.samplePath(sat.tle, now, lineEndTime);

    this.createLookBoxes(window.lookPoints);

    this.createFadedPath(activePathPositions, now, lineEndTime, window.endTime);

    this.createSensorFan(fullWindowPositions, observerLat, observerLon);
  }

  private findBestWindow(sat: Satellite): VisibilityWindow | null {
    const windows = sat.visibility.visibilityWindow || [];
    const now = new Date().getTime();

    // Priority 1
    const active = windows.find(
      (w) => w.startTime.getTime() <= now && w.endTime.getTime() >= now
    );
    if (active) return active;

    // Priority 2
    return windows.find((w) => w.startTime.getTime() > now) || null;
  }

  private samplePath(tle: any, start: Date, end: Date): Cartesian3[] {
    const positions: Cartesian3[] = [];

    if (start.getTime() >= end.getTime()) return positions;

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

  // --- Look Point Boxes ---
  private createLookBoxes(lookPoints: LookPoint[]) {
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
      const position = Cartesian3.fromDegrees(
        lp.location.lon,
        lp.location.lat,
        lp.location.alt * 1000
      );

      const velocity = new Cartesian3(
        lp.velocity.x,
        lp.velocity.y,
        lp.velocity.z
      );

      this.computeOrientation(position, velocity, this._scratchMatrix);
      const modelMatrix = Matrix4.clone(this._scratchMatrix);

      fillInstances.push(
        new GeometryInstance({
          geometry: fillGeom,
          modelMatrix: modelMatrix,
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(BOX_COLOR),
          },
        })
      );

      outlineInstances.push(
        new GeometryInstance({
          geometry: outlineGeom,
          modelMatrix: modelMatrix,
          attributes: {
            color: ColorGeometryInstanceAttribute.fromColor(BOX_OUTLINE_COLOR),
          },
        })
      );
    });

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
          renderState: { lineWidth: 1 },
        }),
        asynchronous: false,
      })
    );
  }

  // --- Faded Path Polyline ---
  private createFadedPath(
    positions: Cartesian3[],
    startTime: Date,
    totalEndTime: Date,
    fadeStartTime: Date
  ) {
    if (positions.length < 2) return;

    const colors: Color[] = [];
    const length = positions.length;

    const startMs = startTime.getTime();
    const totalDuration = totalEndTime.getTime() - startMs;
    const fadeStartMs = fadeStartTime.getTime();

    for (let i = 0; i < length; i++) {
      const t = i / (length - 1);
      const currentTimeMs = startMs + t * totalDuration;

      let alpha = PATH_MAX_ALPHA;

      if (currentTimeMs > fadeStartMs) {
        const overlap = currentTimeMs - fadeStartMs;
        const extensionDuration = totalEndTime.getTime() - fadeStartMs;

        const fadeProgress = Math.min(
          overlap / extensionDuration,
          PATH_MAX_ALPHA
        );

        alpha = PATH_MAX_ALPHA - fadeProgress;
      }

      colors.push(PATH_COLOR.withAlpha(alpha));
    }

    const instance = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: positions,
        width: 1.2,
        colors: colors,
        colorsPerVertex: true,
        arcType: ArcType.NONE,
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

  // --- Sensor Fan ---
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

  private computeOrientation(
    position: Cartesian3,
    velocity: Cartesian3,
    result: Matrix4
  ) {
    Cartesian3.normalize(position, this._scratchUp);
    Cartesian3.normalize(velocity, this._scratchForward);
    Cartesian3.cross(this._scratchForward, this._scratchUp, this._scratchRight);
    Cartesian3.normalize(this._scratchRight, this._scratchRight);
    Cartesian3.cross(this._scratchUp, this._scratchRight, this._scratchForward);
    Cartesian3.normalize(this._scratchForward, this._scratchForward);

    Matrix3.setColumn(
      this._scratchRotation,
      0,
      this._scratchForward,
      this._scratchRotation
    );
    Matrix3.setColumn(
      this._scratchRotation,
      1,
      this._scratchRight,
      this._scratchRotation
    );
    Matrix3.setColumn(
      this._scratchRotation,
      2,
      this._scratchUp,
      this._scratchRotation
    );

    Matrix4.fromRotationTranslation(this._scratchRotation, position, result);
  }

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
