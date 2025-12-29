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
  Ellipsoid,
  BillboardCollection,
  Billboard,
} from "cesium";
import * as satellite from "satellite.js";
import type { TLE } from "../../types";

const TRAIL_LENGTH_METERS = 500000;
const RAINBOW_LENGTH_METERS = 500000;
const SEGMENTS = 20; // For path smoothness

const createSquareImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(94, 234, 212, 0.3)"; // #5eead4 with alpha
    ctx.fillRect(0, 0, 32, 32);
    ctx.strokeStyle = "#ccfbf1";
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 32, 32);
  }
  return canvas.toDataURL();
};
const SHARED_ICON_URL = createSquareImage();

// The Flat Long Trail Geometry
const createFlatTrail = (length: number, width: number, isRainbow: boolean) => {
  const positions: Cartesian3[] = [];
  const colors: Color[] = [];
  const baseColor = Color.fromCssColorString("#ea580c");

  const rawColors = ["#7c3aed", "#0284c7", "#059669", "#ca8a04", "#dc2626"];
  const palette = rawColors.map((c) => Color.fromCssColorString(c));
  const maxIdx = palette.length - 1;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;

    const x = -(t * length);
    positions.push(new Cartesian3(x, 0, 0));

    if (isRainbow) {
      const colorPos = 1.0 - t;
      const scaledT = colorPos * maxIdx;
      const idx1 = Math.floor(scaledT);
      const idx2 = Math.min(idx1 + 1, maxIdx);
      const rgb = Color.lerp(
        palette[idx1],
        palette[idx2],
        scaledT - idx1,
        new Color()
      );
      colors.push(Color.fromAlpha(rgb, colorPos));
    } else {
      colors.push(baseColor.withAlpha(0.7 * (1.0 - t)));
    }
  }

  return new PolylineGeometry({
    positions,
    colors,
    colorsPerVertex: true,
    width: width,
    arcType: ArcType.NONE,
  });
};

const SHARED_FLAT_PATH = createFlatTrail(TRAIL_LENGTH_METERS, 2.0, false);
const SHARED_FLAT_RAINBOW = createFlatTrail(RAINBOW_LENGTH_METERS, 2.0, true);

export class SpaceObjectComposition2D {
  private _viewer: Viewer;
  private _satrec: satellite.SatRec;
  private _removeListener: (() => void) | undefined;

  // Visual Components
  private _billboardCollection: BillboardCollection;
  private _billboard: Billboard;
  private _longTrailPrimitive: Primitive;
  private _rainbowPrimitive: Primitive;

  // Zero-Allocation Scratch Memory
  private _scratchDate = new Date();
  private _scratchPos = new Cartesian3();
  private _scratchGroundPos = new Cartesian3();
  private _scratchNextGround = new Cartesian3();

  private _scratchUp = new Cartesian3();
  private _scratchForward = new Cartesian3();
  private _scratchRight = new Cartesian3();
  private _scratchRotation = new Matrix3();
  private _scratchOrbitFrame = new Matrix4();

  constructor(tle: TLE, viewer: Viewer) {
    this._viewer = viewer;
    this._satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    this._billboardCollection = new BillboardCollection();
    this._billboard = this._billboardCollection.add({
      image: SHARED_ICON_URL,
      position: Cartesian3.ZERO,
      width: 14,
      height: 14,
      color: Color.WHITE,
    });
    this._billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;

    this._longTrailPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({ geometry: SHARED_FLAT_PATH }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    this._rainbowPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: SHARED_FLAT_RAINBOW,
      }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    const primitives = this._viewer.scene.primitives;
    primitives.add(this._billboardCollection);
    primitives.add(this._longTrailPrimitive);

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

    Ellipsoid.WGS84.scaleToGeodeticSurface(
      this._scratchPos,
      this._scratchGroundPos
    );

    jsDate.setSeconds(jsDate.getSeconds() + 1);
    const nextGmst = satellite.gstime(jsDate);
    const nextPosVel = satellite.propagate(this._satrec, jsDate);

    if (nextPosVel?.position) {
      const nextEci = nextPosVel.position as satellite.EciVec3<number>;
      const nextEcf = satellite.eciToEcf(nextEci, nextGmst);

      this._scratchPos.x = nextEcf.x * 1000;
      this._scratchPos.y = nextEcf.y * 1000;
      this._scratchPos.z = nextEcf.z * 1000;

      Ellipsoid.WGS84.scaleToGeodeticSurface(
        this._scratchPos,
        this._scratchNextGround
      );

      this._scratchForward.x =
        this._scratchNextGround.x - this._scratchGroundPos.x;
      this._scratchForward.y =
        this._scratchNextGround.y - this._scratchGroundPos.y;
      this._scratchForward.z =
        this._scratchNextGround.z - this._scratchGroundPos.z;
    }

    this._billboard.position = this._scratchGroundPos;

    this.computeGroundMatrix(
      this._scratchGroundPos,
      this._scratchForward,
      this._scratchOrbitFrame
    );

    Matrix4.clone(
      this._scratchOrbitFrame,
      this._longTrailPrimitive.modelMatrix
    );
    Matrix4.clone(this._scratchOrbitFrame, this._rainbowPrimitive.modelMatrix);
  }

  /**
   * Builds a rotation matrix aligned to the Ground Track
   */
  private computeGroundMatrix(
    position: Cartesian3,
    forwardDirection: Cartesian3,
    result: Matrix4
  ): void {
    Cartesian3.normalize(position, this._scratchUp);

    Cartesian3.normalize(forwardDirection, this._scratchForward);

    Cartesian3.cross(this._scratchUp, this._scratchForward, this._scratchRight);

    Cartesian3.cross(this._scratchRight, this._scratchUp, this._scratchForward);

    // Rotation Matrix
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

  private setShow(visible: boolean) {
    if (this._billboard.show !== visible) {
      this._billboard.show = visible;
      this._longTrailPrimitive.show = visible;
    }
  }

  destroy(): void {
    if (this._removeListener) this._removeListener();
    const primitives = this._viewer.scene.primitives;

    // Cleanup
    primitives.remove(this._billboardCollection);
    primitives.remove(this._longTrailPrimitive);
    primitives.remove(this._rainbowPrimitive);
  }
}
