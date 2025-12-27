import {
  Primitive,
  GeometryInstance,
  PolylineGeometry,
  PolylineColorAppearance,
  Matrix4,
  Matrix3,
  Cartesian3,
  Color,
  JulianDate,
  ArcType,
  Scene,
  Viewer,
} from "cesium";
import * as satellite from "satellite.js";
import type { TLE } from "../../types";

// --- CONFIGURATION ---
const PATH_LENGTH_BASE = 20000000; // 20 000km tail at Earth Surface
const REFERENCE_RADIUS = 6378137.0; // Earth Radius (meters)
const SEGMENTS = 60;

// --- SHARED ASSET (Created Once) ---
const createPathGeometry = () => {
  const positions: Cartesian3[] = [];
  const colors: Color[] = [];
  const baseColor = Color.fromCssColorString("#2dd4bf");
  const R = REFERENCE_RADIUS;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const angle = -(t * PATH_LENGTH_BASE) / R; // Curve backwards

    // Circular arc in Local X/Z Plane
    const x = R * Math.sin(angle);
    const z = R * Math.cos(angle) - R;

    positions.push(new Cartesian3(x, 0, z));
    colors.push(baseColor.withAlpha(0.3 * (1.0 - t))); // Fade
  }

  return new PolylineGeometry({
    positions,
    colors,
    colorsPerVertex: true,
    width: 1.0,
    arcType: ArcType.NONE,
  });
};

let sharedPathGeometry: PolylineGeometry | null = null;

export class SpacePathPrimitive {
  private _primitive: Primitive;
  private _satrec: satellite.SatRec;
  private _viewer: Viewer;
  private _removeListener: (() => void) | undefined;

  // Scratch Memory
  private _scratchDate = new Date();
  private _scratchPos = new Cartesian3();
  private _scratchVel = new Cartesian3();
  private _scratchUp = new Cartesian3();
  private _scratchForward = new Cartesian3();
  private _scratchRight = new Cartesian3();
  private _scratchRotation = new Matrix3();
  private _scratchScale = new Cartesian3();
  private _scratchOrbitFrame = new Matrix4();

  constructor(tle: TLE, viewer: Viewer) {
    this._viewer = viewer;
    this._satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    if (!sharedPathGeometry) {
      sharedPathGeometry = createPathGeometry();
    }

    this._primitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: sharedPathGeometry!,
        id: "trail-" + Math.random().toString(36).substr(2, 9),
      }),
      appearance: new PolylineColorAppearance({
        translucent: true,
      }),
      asynchronous: false,
    });

    this._viewer.scene.primitives.add(this._primitive);
    this.startUpdateLoop();
  }

  private startUpdateLoop() {
    this._removeListener = this._viewer.scene.preUpdate.addEventListener(
      (_: Scene, time: JulianDate) => {
        this.update(time);
      }
    );
  }

  private update(time: JulianDate): void {
    // 1. Time Sync (1 Allocation: new Date)
    // Unavoidable if we want perfect sync with Cesium's PointEntity
    const jsDate = JulianDate.toDate(time);
    this._scratchDate.setTime(jsDate.getTime());

    // 2. Physics (2 Allocations: Internal to satellite.js)
    const gmst = satellite.gstime(this._scratchDate);
    const posVel = satellite.propagate(this._satrec, this._scratchDate);

    if (!posVel?.position || typeof posVel?.position !== "object") {
      this._primitive.show = false;
      return;
    }
    this._primitive.show = true;

    const pEci = posVel.position as satellite.EciVec3<number>;
    const pEcf = satellite.eciToEcf(pEci, gmst); // 1 Allocation (Internal)

    this._scratchPos.x = pEcf.x * 1000;
    this._scratchPos.y = pEcf.y * 1000;
    this._scratchPos.z = pEcf.z * 1000;

    // 3. Velocity Calculation (Zero Allocation)
    jsDate.setSeconds(jsDate.getSeconds() + 1);
    const nextGmst = satellite.gstime(jsDate);
    const nextPosVel = satellite.propagate(this._satrec, jsDate);

    if (nextPosVel?.position) {
      const nextEci = nextPosVel.position as satellite.EciVec3<number>;
      const nextEcf = satellite.eciToEcf(nextEci, nextGmst);

      this._scratchVel.x = nextEcf.x * 1000 - this._scratchPos.x;
      this._scratchVel.y = nextEcf.y * 1000 - this._scratchPos.y;
      this._scratchVel.z = nextEcf.z * 1000 - this._scratchPos.z;
    }

    // 4. Scale (Zero Allocation)
    const orbitalRadius = Cartesian3.magnitude(this._scratchPos);
    const scaleFactor = orbitalRadius / REFERENCE_RADIUS;

    this._scratchScale.x = scaleFactor;
    this._scratchScale.y = scaleFactor;
    this._scratchScale.z = scaleFactor;

    // 5. Matrix Math (Zero Allocation)
    this.computeTransformMatrix(
      this._scratchPos,
      this._scratchVel,
      this._scratchScale,
      this._scratchOrbitFrame
    );

    // 6. Update Primitive (STRICT ZERO ALLOCATION FIX)
    Matrix4.clone(this._scratchOrbitFrame, this._primitive.modelMatrix);
  }

  private computeTransformMatrix(
    position: Cartesian3,
    velocity: Cartesian3,
    scale: Cartesian3,
    result: Matrix4
  ): void {
    Cartesian3.normalize(position, this._scratchUp);
    Cartesian3.normalize(velocity, this._scratchForward);
    Cartesian3.cross(this._scratchUp, this._scratchForward, this._scratchRight);
    Cartesian3.cross(this._scratchRight, this._scratchUp, this._scratchForward);

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
    Matrix4.multiplyByScale(result, scale, result);
  }

  destroy(): void {
    if (this._removeListener) this._removeListener();
    this._viewer.scene.primitives.remove(this._primitive);
  }
}
