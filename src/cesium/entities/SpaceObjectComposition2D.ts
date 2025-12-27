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

// --- CONFIGURATION ---
// Much shorter trails for zoomed-in ground view
const TRAIL_LENGTH_METERS = 500000; // 500km Long Trail
const RAINBOW_LENGTH_METERS = 500000; // 500km Rainbow Flare
const SEGMENTS = 20; // Lower detail needed for short lines

// --- SHARED ASSETS ---

// 1. GENERATE A SIMPLE SQUARE TEXTURE (Data URI)
// This creates a simple cyan square image for the Billboard so we don't need external assets.
const createSquareImage = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Fill
    ctx.fillStyle = "rgba(94, 234, 212, 0.3)"; // #5eead4 with alpha
    ctx.fillRect(0, 0, 32, 32);
    // Border
    ctx.strokeStyle = "#ccfbf1"; // #ccfbf1
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 32, 32);
  }
  return canvas.toDataURL();
};
const SHARED_ICON_URL = createSquareImage();

// 2. The Flat Long Trail Geometry
const createFlatTrail = (length: number, width: number, isRainbow: boolean) => {
  const positions: Cartesian3[] = [];
  const colors: Color[] = [];
  const baseColor = Color.fromCssColorString("#ea580c"); // original teal #2dd4bf

  // Rainbow Palette
  const rawColors = ["#7c3aed", "#0284c7", "#059669", "#ca8a04", "#dc2626"];
  const palette = rawColors.map((c) => Color.fromCssColorString(c));
  const maxIdx = palette.length - 1;

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;

    // Geometry: A simple straight line along the negative X axis
    // We don't curve it vertically because it's short and clamped to ground.
    const x = -(t * length);
    positions.push(new Cartesian3(x, 0, 0));

    // Color Logic
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
      // Simple Teal Fade
      colors.push(baseColor.withAlpha(0.7 * (1.0 - t)));
    }
  }

  return new PolylineGeometry({
    positions,
    colors,
    colorsPerVertex: true,
    width: width,
    arcType: ArcType.NONE, // Straight lines, faster
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
  private _scratchPos = new Cartesian3(); // 3D Space Position
  private _scratchGroundPos = new Cartesian3(); // Projected Ground Position
  private _scratchNextGround = new Cartesian3();

  private _scratchUp = new Cartesian3();
  private _scratchForward = new Cartesian3();
  private _scratchRight = new Cartesian3();
  private _scratchRotation = new Matrix3();
  private _scratchOrbitFrame = new Matrix4();

  constructor(tle: TLE, viewer: Viewer) {
    this._viewer = viewer;
    this._satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    // A. Setup Billboard (The Fixed-Size "Box")
    // We use a Collection because Billboards are essentially Primitives
    this._billboardCollection = new BillboardCollection();
    this._billboard = this._billboardCollection.add({
      image: SHARED_ICON_URL,
      position: Cartesian3.ZERO,
      width: 14, // Fixed Pixel Size
      height: 14, // Fixed Pixel Size
      color: Color.WHITE,
    });
    // Don't depth test the billboard so it sits "on top" of the trail
    this._billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;

    // B. Setup Flat Path Trail
    this._longTrailPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({ geometry: SHARED_FLAT_PATH }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    // C. Setup Flat Rainbow Trail
    this._rainbowPrimitive = new Primitive({
      geometryInstances: new GeometryInstance({
        geometry: SHARED_FLAT_RAINBOW,
      }),
      appearance: new PolylineColorAppearance({ translucent: true }),
      asynchronous: false,
    });

    // Add to Scene
    const primitives = this._viewer.scene.primitives;
    primitives.add(this._billboardCollection);
    primitives.add(this._longTrailPrimitive);
    // primitives.add(this._rainbowPrimitive);

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

    // 1. Physics & Ground Projection
    const gmst = satellite.gstime(this._scratchDate);
    const posVel = satellite.propagate(this._satrec, this._scratchDate);

    if (!posVel?.position || typeof posVel?.position !== "object") {
      this.setShow(false);
      return;
    }
    this.setShow(true);

    const pEci = posVel.position as satellite.EciVec3<number>;
    const pEcf = satellite.eciToEcf(pEci, gmst);

    // Convert to Cartesian3
    this._scratchPos.x = pEcf.x * 1000;
    this._scratchPos.y = pEcf.y * 1000;
    this._scratchPos.z = pEcf.z * 1000;

    // PROJECT TO GROUND (Alt = 0)
    // This efficiently snaps the 3D point to the Ellipsoid surface
    Ellipsoid.WGS84.scaleToGeodeticSurface(
      this._scratchPos,
      this._scratchGroundPos
    );

    // 2. Calculate Ground Velocity (Heading)
    // We look 1 second into the future, project THAT to the ground,
    // and see which way the "Ground Track" is moving.
    jsDate.setSeconds(jsDate.getSeconds() + 1);
    const nextGmst = satellite.gstime(jsDate);
    const nextPosVel = satellite.propagate(this._satrec, jsDate);

    if (nextPosVel?.position) {
      const nextEci = nextPosVel.position as satellite.EciVec3<number>;
      const nextEcf = satellite.eciToEcf(nextEci, nextGmst);

      // We perform the vector math manually to avoid allocations
      // Reuse _scratchPos temporarily for the Next ECF
      // (safe because we are done with the raw _scratchPos for this frame)
      this._scratchPos.x = nextEcf.x * 1000;
      this._scratchPos.y = nextEcf.y * 1000;
      this._scratchPos.z = nextEcf.z * 1000;

      Ellipsoid.WGS84.scaleToGeodeticSurface(
        this._scratchPos,
        this._scratchNextGround
      );

      // Forward Vector = NextGround - CurrGround
      this._scratchForward.x =
        this._scratchNextGround.x - this._scratchGroundPos.x;
      this._scratchForward.y =
        this._scratchNextGround.y - this._scratchGroundPos.y;
      this._scratchForward.z =
        this._scratchNextGround.z - this._scratchGroundPos.z;
    }

    // 3. Update Billboard Position
    // Billboards update simply by setting .position
    this._billboard.position = this._scratchGroundPos;

    // 4. Compute Matrix for Trails
    // We construct a matrix at 'GroundPos', oriented along 'Forward'
    this.computeGroundMatrix(
      this._scratchGroundPos,
      this._scratchForward,
      this._scratchOrbitFrame
    );

    // 5. Apply Matrix to Trails
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
    // Up = Surface Normal (Normalized Position)
    Cartesian3.normalize(position, this._scratchUp);

    // Forward = Ground Track Direction
    Cartesian3.normalize(forwardDirection, this._scratchForward);

    // Right = Cross(Up, Forward)
    Cartesian3.cross(this._scratchUp, this._scratchForward, this._scratchRight);

    // Re-orthogonalize Forward to ensure perfect 90 degree angles
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

    // Final Matrix
    Matrix4.fromRotationTranslation(this._scratchRotation, position, result);
    // Note: No scaling needed for ground view (Fixed geometry size)
  }

  private setShow(visible: boolean) {
    if (this._billboard.show !== visible) {
      // Micro-optimization
      this._billboard.show = visible;
      this._longTrailPrimitive.show = visible;
      // this._rainbowPrimitive.show = visible;
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
