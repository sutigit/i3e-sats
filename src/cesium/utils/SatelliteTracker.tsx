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
import type { TLE, LookPoint } from "../../types";

export default class SatelliteTracker {
    private _viewer: Viewer;
    private _range: number;

    // Tracking State
    private _mode: "SATELLITE" | "STATIC" | "NONE" = "NONE";
    private _removeListener: (() => void) | undefined;

    // Data Sources
    private _satrec: satellite.SatRec | null = null;
    private _staticTransform = new Matrix4(); // Cache for the static point

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
        this._offset = new HeadingPitchRange(0, -CesiumMath.PI_OVER_TWO, this._range);
    }

    /**
     * Mode 1: Track a moving Satellite (re-propagates position every frame)
     */
    public track(tle: TLE) {
        this.stop(); // Clean up previous state

        this._satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        this._mode = "SATELLITE";

        // Snap immediately, then start loop
        this.updateCamera(this._viewer.clock.currentTime);
        this.startListener();
    }

    /**
     * Mode 2: Point to a fixed LookPoint (locks camera to specific lat/lon)
     */
    public point(lookPoint: LookPoint) {
        this.stop(); // Clean up previous state

        // Calculate the transform ONCE since the point doesn't move relative to Earth
        const position = Cartesian3.fromDegrees(
            lookPoint.location.lon,
            lookPoint.location.lat,
            lookPoint.location.alt * 1000 // Convert km to meters
        );

        Transforms.eastNorthUpToFixedFrame(position, undefined, this._staticTransform);
        this._mode = "STATIC";

        // Snap immediately, then start loop
        this.updateCamera(this._viewer.clock.currentTime);
        this.startListener();
    }

    public stop() {
        if (this._removeListener) {
            this._removeListener();
            this._removeListener = undefined;
        }
        this._mode = "NONE";
        this._satrec = null;

        // Release the camera so it behaves normally again
        this._viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    }

    private startListener() {
        if (!this._removeListener) {
            this._removeListener = this._viewer.scene.preUpdate.addEventListener((_: Scene, time: JulianDate) => {
                this.updateCamera(time);
            });
        }
    }

    private updateCamera(time: JulianDate) {
        if (this._mode === "NONE") return;

        // --- A. STATIC MODE ---
        // We re-apply the transform every frame to "fight" user input 
        // and keep the camera strictly locked top-down.
        if (this._mode === "STATIC") {
            this._viewer.camera.lookAtTransform(
                this._staticTransform,
                this._offset
            );
            return;
        }

        // --- B. SATELLITE MODE ---
        if (this._mode === "SATELLITE" && this._satrec) {
            // 1. Time & Physics
            const jsDate = JulianDate.toDate(time);
            this._scratchDate.setTime(jsDate.getTime());

            const posVel = satellite.propagate(this._satrec, this._scratchDate);
            const gmst = satellite.gstime(this._scratchDate);

            if (!posVel?.position || typeof posVel.position !== 'object') return;

            // 2. Coordinates
            const pEci = posVel.position as satellite.EciVec3<number>;
            const pEcf = satellite.eciToEcf(pEci, gmst);

            if (isNaN(pEcf.x)) return;

            this._scratchPos.x = pEcf.x * 1000;
            this._scratchPos.y = pEcf.y * 1000;
            this._scratchPos.z = pEcf.z * 1000;

            // 3. New Reference Frame (Origin = Satellite)
            Transforms.eastNorthUpToFixedFrame(
                this._scratchPos,
                undefined,
                this._scratchTransform
            );

            // 4. Apply Transform
            this._viewer.camera.lookAtTransform(
                this._scratchTransform,
                this._offset
            );
        }
    }
}