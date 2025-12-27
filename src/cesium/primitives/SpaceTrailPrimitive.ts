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
const TRAIL_LENGTH_BASE = 5000000; // 5000km (Shorter "Instantaneous" Tail)
const REFERENCE_RADIUS = 6378137.0; // Earth Radius
const SEGMENTS = 40; // High detail for the gradient

// --- COLOR CONFIGURATION ---
// Violet -> Blue -> Green -> Yellow -> Red
const RAW_COLORS = ["#7c3aed", "#0284c7", "#059669", "#ca8a04", "#dc2626"];
const PALETTE = RAW_COLORS.map((c) => Color.fromCssColorString(c));

// --- SHARED ASSET (Created Once) ---
const createTrailGeometry = () => {
  const positions: Cartesian3[] = [];
  const colors: Color[] = [];
  const R = REFERENCE_RADIUS;
  const maxIdx = PALETTE.length - 1;

  for (let i = 0; i <= SEGMENTS; i++) {
    // t represents "Distance from Head"
    // 0.0 = Head (Satellite)
    // 1.0 = Tail (End of trail)
    const t = i / SEGMENTS;

    // 1. SHAPE: Curve backwards in Local X/Z Plane
    const angle = -(t * TRAIL_LENGTH_BASE) / R;
    const x = R * Math.sin(angle);
    const z = R * Math.cos(angle) - R;
    positions.push(new Cartesian3(x, 0, z));

    // 2. COLOR: Interpolate Gradient
    // We want the Head (t=0) to be RED (Index 4) and Opaque
    // We want the Tail (t=1) to be VIOLET (Index 0) and Transparent

    // Invert t for color lookup so 1.0 is Red (Head) and 0.0 is Violet (Tail)
    const colorPos = 1.0 - t;

    // Map to palette indices
    const scaledT = colorPos * maxIdx;
    const idx1 = Math.floor(scaledT);
    const idx2 = Math.min(idx1 + 1, maxIdx);

    // Lerp RGB
    const scratchColor = new Color();
    const rgb = Color.lerp(
      PALETTE[idx1],
      PALETTE[idx2],
      scaledT - idx1,
      scratchColor
    );

    // Alpha Logic: Head=1.0 -> Tail=0.0
    // We use 'colorPos' which is already 1.0 at Head and 0.0 at Tail
    colors.push(Color.fromAlpha(rgb, colorPos));
  }

  return new PolylineGeometry({
    positions,
    colors,
    colorsPerVertex: true,
    width: 1.2, // Slightly thicker than the path for emphasis
    arcType: ArcType.NONE,
  });
};

let sharedTrailGeometry: PolylineGeometry | null = null;

export class SpaceTrailPrimitive {
  private _primitive: Primitive;
  private _satrec: satellite.SatRec;
  private _viewer: Viewer;
  private _removeListener: (() => void) | undefined;

  // Zero-Allocation Scratch Memory
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

    if (!sharedTrailGeometry) {
      sharedTrailGeometry = createTrailGeometry();
    }

    this._primitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: sharedTrailGeometry!,
        id: "trail-tail-" + Math.random().toString(36).substr(2, 9),
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
    // 1. Time Sync (1 Alloc)
    const jsDate = JulianDate.toDate(time);
    this._scratchDate.setTime(jsDate.getTime());

    // 2. Physics & GMST
    const gmst = satellite.gstime(this._scratchDate);
    const posVel = satellite.propagate(this._satrec, this._scratchDate);

    if (!posVel?.position || typeof posVel?.position !== "object") {
      this._primitive.show = false;
      return;
    }
    this._primitive.show = true;

    // 3. Position (ECI -> ECF)
    const pEci = posVel?.position as satellite.EciVec3<number>;
    const pEcf = satellite.eciToEcf(pEci, gmst);

    this._scratchPos.x = pEcf.x * 1000;
    this._scratchPos.y = pEcf.y * 1000;
    this._scratchPos.z = pEcf.z * 1000;

    // 4. Velocity (Look Ahead 1s)
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

    // 5. Scale (Altitude based)
    const orbitalRadius = Cartesian3.magnitude(this._scratchPos);
    const scaleFactor = orbitalRadius / REFERENCE_RADIUS;

    this._scratchScale.x = scaleFactor;
    this._scratchScale.y = scaleFactor;
    this._scratchScale.z = scaleFactor;

    // 6. Matrix Calculation (Zero Alloc)
    this.computeTransformMatrix(
      this._scratchPos,
      this._scratchVel,
      this._scratchScale,
      this._scratchOrbitFrame
    );

    // 7. Update Primitive (Zero Alloc Copy)
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
