import {
    Viewer,
    Cartesian3,
    Matrix4,
    Transforms,
    JulianDate,
    HeadingPitchRange,
    Scene,
    Math as CesiumMath
} from "cesium";
import * as satellite from "satellite.js";
import type { TLE } from "../../types";

export default class SatelliteTracker {
    private _viewer: Viewer;
    private _range: number;
    private _satrec: satellite.SatRec | null = null;
    private _removeListener: (() => void) | undefined;

    // Reuse the offset object to avoid allocation
    private _offset: HeadingPitchRange;

    // Scratch variables
    private _scratchDate = new Date();
    private _scratchPos = new Cartesian3();
    private _scratchTransform = new Matrix4();

    constructor(viewer: Viewer, range: number = 1000000) {
        this._viewer = viewer;
        this._range = range;

        // Create the fixed "Look Down" offset once
        // Heading: 0 (North Up)
        // Pitch: -90 degrees (Top Down)
        // Range: Fixed altitude
        this._offset = new HeadingPitchRange(0, -CesiumMath.PI_OVER_TWO, this._range);
    }

    public track(tle: TLE) {
        this._satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        // Snap immediately
        this.updateCamera(this._viewer.clock.currentTime);

        if (!this._removeListener) {
            this._removeListener = this._viewer.scene.preUpdate.addEventListener((_: Scene, time: JulianDate) => {
                this.updateCamera(time);
            });
        }
    }

    public stop() {
        if (this._removeListener) {
            this._removeListener();
            this._removeListener = undefined;
        }
        this._satrec = null;
        this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    }

    private updateCamera(time: JulianDate) {
        if (!this._satrec) return;

        // 1. Time & Physics
        const jsDate = JulianDate.toDate(time);
        this._scratchDate.setTime(jsDate.getTime());
        const posVel = satellite.propagate(this._satrec, this._scratchDate);
        const gmst = satellite.gstime(this._scratchDate);

        if (!posVel?.position || typeof posVel.position !== 'object') return;

        // 2. Coordinates
        const pEci = posVel.position as satellite.EciVec3<number>;
        const pEcf = satellite.eciToEcf(pEci, gmst);

        if (isNaN(pEcf.x)) return; // Safety

        this._scratchPos.x = pEcf.x * 1000;
        this._scratchPos.y = pEcf.y * 1000;
        this._scratchPos.z = pEcf.z * 1000;

        // 3. New Reference Frame (Origin = Satellite)
        Transforms.eastNorthUpToFixedFrame(
            this._scratchPos,
            undefined,
            this._scratchTransform
        );

        // 4. Apply Transform AND Offset every frame
        // This forces the camera to teleport to the new relative position.
        this._viewer.camera.lookAtTransform(
            this._scratchTransform,
            this._offset
        );
    }
}