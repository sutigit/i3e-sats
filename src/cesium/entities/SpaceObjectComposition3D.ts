import {
  Primitive,
  GeometryInstance,
  BoxGeometry,
  PolylineGeometry,
  PolylineColorAppearance,
  PerInstanceColorAppearance,
  Matrix4,
  Matrix3,
  Cartesian3,
  Color,
  JulianDate,
  ArcType,
  Scene,
  Viewer,
  BoxOutlineGeometry,
  ColorGeometryInstanceAttribute,
} from "cesium";

import * as satellite from "satellite.js";
import type { TLE } from "../../types";

const TRAIL_LENGTH_BASE = 20000000;
const RAINBOW_LENGTH_BASE = 4000000;
const REFERENCE_RADIUS = 6378137.0;
const SEGMENTS = 60; // For path smoothness

// The Box Geometry (Satellite Body)
// Centered at 0,0,0. Dimensions 50km x 50km x 50km
const BOX_FILL_GEOM = new BoxGeometry({
  maximum: new Cartesian3(25000, 25000, 25000),
  minimum: new Cartesian3(-25000, -25000, -25000),
});

const BOX_OUTLINE_GEOM = new BoxOutlineGeometry({
  maximum: new Cartesian3(25000, 25000, 25000),
  minimum: new Cartesian3(-25000, -25000, -25000),
});

// The Long Trail Geometry
// Starts at 0,0,0 and curves backwards
const createPathTrail = () => {
  const positions: Cartesian3[] = [];
  const colors: Color[] = [];
  const baseColor = Color.fromCssColorString("#2dd4bf").withAlpha(0.8);
  const R = REFERENCE_RADIUS;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const angle = -(t * TRAIL_LENGTH_BASE) / R;
    const x = R * Math.sin(angle);
    const z = R * Math.cos(angle) - R;
    positions.push(new Cartesian3(x, 0, z));
    colors.push(baseColor.withAlpha(0.4 * (1.0 - t))); // Fainter
  }
  return new PolylineGeometry({
    positions,
    colors,
    colorsPerVertex: true,
    width: 1.2,
    arcType: ArcType.NONE,
  });
};
const PATH_TRAIL_GEOM = createPathTrail();

// The Rainbow Trail Geometry
// Starts at 0,0,0 and curves backwards (Shorter)
const createRainbowTrail = () => {
  const positions: Cartesian3[] = [];
  const colors: Color[] = [];
  const rawColors = ["#7c3aed", "#0284c7", "#059669", "#ca8a04", "#dc2626"];
  const palette = rawColors.map((c) =>
    Color.fromCssColorString(c).withAlpha(0.8)
  );
  const R = REFERENCE_RADIUS;
  const maxIdx = palette.length - 1;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const angle = -(t * RAINBOW_LENGTH_BASE) / R;
    const x = R * Math.sin(angle);
    const z = R * Math.cos(angle) - R;
    positions.push(new Cartesian3(x, 0, z));

    const colorPos = 1.0 - t;
    const scaledT = colorPos * maxIdx;
    const idx1 = Math.floor(scaledT);
    const idx2 = Math.min(idx1 + 1, maxIdx);
    const scratchColor = new Color();
    const rgb = Color.lerp(
      palette[idx1],
      palette[idx2],
      scaledT - idx1,
      scratchColor
    );
    colors.push(Color.fromAlpha(rgb, colorPos));
  }
  return new PolylineGeometry({
    positions,
    colors,
    colorsPerVertex: true,
    width: 1.2,
    arcType: ArcType.NONE,
  });
};
const RAINBOW_TRAIL_GEOM = createRainbowTrail();

export class SpaceObjectComposition3D {
  private _viewer: Viewer;
  private _satrec: satellite.SatRec;
  private _removeListener: (() => void) | undefined;

  private _boxPrimitive: Primitive;
  private _boxOutlinePrimitive: Primitive;
  private _longTrailPrimitive: Primitive;
  private _rainbowPrimitive: Primitive;

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

    this._boxPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: BOX_FILL_GEOM,
        id: "box-fill-" + Math.random(),
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            Color.fromCssColorString("#5eead4").withAlpha(0.25)
          ),
        },
      }),
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: true,
      }),
      asynchronous: false,
    });

    this._boxOutlinePrimitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: BOX_OUTLINE_GEOM,
        attributes: {
          color: ColorGeometryInstanceAttribute.fromColor(
            Color.fromCssColorString("#ccfbf1") // Outline Color
          ),
        },
      }),
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: true,
        renderState: {
          lineWidth: 1,
        },
      }),
      asynchronous: false,
    });

    this._longTrailPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({ geometry: PATH_TRAIL_GEOM }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    this._rainbowPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: RAINBOW_TRAIL_GEOM,
      }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    const primitives = this._viewer.scene.primitives;
    primitives.add(this._boxPrimitive);
    primitives.add(this._boxOutlinePrimitive);
    primitives.add(this._longTrailPrimitive);
    primitives.add(this._rainbowPrimitive);

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
    const jsDate = JulianDate.toDate(time);
    this._scratchDate.setTime(jsDate.getTime());

    const gmst = satellite.gstime(this._scratchDate);
    const posVel = satellite.propagate(this._satrec, this._scratchDate);

    if (!posVel?.position || typeof posVel?.position !== "object") {
      this.setShow(false);
      return;
    }
    this.setShow(true);

    const pEci = posVel.position as satellite.EciVec3<number>;
    const pEcf = satellite.eciToEcf(pEci, gmst);

    this._scratchPos.x = pEcf.x * 1000;
    this._scratchPos.y = pEcf.y * 1000;
    this._scratchPos.z = pEcf.z * 1000;

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

    const orbitalRadius = Cartesian3.magnitude(this._scratchPos);
    const scaleFactor = orbitalRadius / REFERENCE_RADIUS;

    this._scratchScale.x = scaleFactor;
    this._scratchScale.y = scaleFactor;
    this._scratchScale.z = scaleFactor;

    this.computeTransformMatrix(
      this._scratchPos,
      this._scratchVel,
      undefined,
      this._scratchOrbitFrame
    );

    Matrix4.clone(this._scratchOrbitFrame, this._boxPrimitive.modelMatrix);
    Matrix4.clone(
      this._scratchOrbitFrame,
      this._boxOutlinePrimitive.modelMatrix
    );

    this.computeTransformMatrix(
      this._scratchPos,
      this._scratchVel,
      this._scratchScale,
      this._scratchOrbitFrame
    );

    Matrix4.clone(
      this._scratchOrbitFrame,
      this._longTrailPrimitive.modelMatrix
    );
    Matrix4.clone(this._scratchOrbitFrame, this._rainbowPrimitive.modelMatrix);
  }

  private setShow(visible: boolean) {
    this._boxPrimitive.show = visible;
    this._boxOutlinePrimitive.show = visible;
    this._longTrailPrimitive.show = visible;
    this._rainbowPrimitive.show = visible;
  }

  private computeTransformMatrix(
    position: Cartesian3,
    velocity: Cartesian3,
    scale: Cartesian3 | undefined,
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

    if (scale) {
      Matrix4.multiplyByScale(result, scale, result);
    }
  }

  destroy(): void {
    if (this._removeListener) this._removeListener();
    const primitives = this._viewer.scene.primitives;
    primitives.remove(this._boxPrimitive);
    primitives.remove(this._boxOutlinePrimitive);
    primitives.remove(this._longTrailPrimitive);
    primitives.remove(this._rainbowPrimitive);
  }
}
