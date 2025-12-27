import {
    Entity,
    Cartesian3,
    Quaternion,
    HeadingPitchRoll,
    Matrix4,
    CallbackProperty,
    CallbackPositionProperty,
    Color,
    HeightReference,
    Math as CesiumMath,
    JulianDate,
    Transforms,
    BoxGraphics,
    BillboardGraphics
} from "cesium";
import * as satellite from "satellite.js";
import type { TLE } from "../../types";
// Ensure this import is pointing to a URL string or Image object, NOT a React component!
import { satelliteSVG } from "../icons";

const SATELLITE_ICON = satelliteSVG;

// Pre-calculate constants to avoid math in the loop
const UNIX_EPOCH_JULIAN = 2440587.5;
const TICKS_PER_DAY = 86400000; // Daily milliseconds

export class PointEntity {
    public readonly entity: Entity;

    private readonly satrec: satellite.SatRec;
    private readonly scratchDate = new Date();
    private readonly scratchPosNow = new Cartesian3();
    private readonly scratchPosNext = new Cartesian3();
    private readonly scratchVel = new Cartesian3();
    private readonly scratchHpr = new HeadingPitchRoll(0, 0, 0);
    private readonly scratchQuaternion = new Quaternion();
    private readonly scratchFixedFrame = new Matrix4();
    private readonly scratchInverse = new Matrix4();
    private readonly scratchLocalVel = new Cartesian3();
    private readonly scratchAxis = new Cartesian3();

    constructor(
        id: string,
        tle: TLE,
        mode: "space" | "ground"
    ) {
        this.satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        const positionCallback = new CallbackPositionProperty(
            this.updatePosition.bind(this),
            false
        );

        const orientationCallback = new CallbackProperty(
            this.updateOrientation.bind(this),
            false
        );

        const entityOptions: Entity.ConstructorOptions = {
            id,
            position: positionCallback,
            orientation: orientationCallback,
        };

        if (mode === "space") {
            entityOptions.box = new BoxGraphics({
                dimensions: new Cartesian3(50000.0, 50000.0, 50000.0),
                material: Color.fromCssColorString("#5eead4").withAlpha(0.3),
                // WARNING: Outlines on transparent boxes are expensive. 
                // If performance lags with 500+ sats, set this to false.
                outline: true,
                outlineColor: Color.fromCssColorString("#ccfbf1"),
            });
        } else {
            const rotationCallback = new CallbackProperty((time, _) => {
                const q = orientationCallback.getValue(time, this.scratchQuaternion);
                if (!q) return 0;
                const hpr = HeadingPitchRoll.fromQuaternion(q, this.scratchHpr);
                return -hpr.heading + CesiumMath.PI_OVER_TWO;
            }, false);

            const alignedAxisCallback = new CallbackProperty((time, result) => {
                const pos = positionCallback.getValue(time, this.scratchPosNow);
                return pos ? Cartesian3.normalize(pos, result || this.scratchAxis) : undefined;
            }, false);

            entityOptions.billboard = new BillboardGraphics({
                image: SATELLITE_ICON,
                width: 14,
                height: 14,
                rotation: rotationCallback,
                alignedAxis: alignedAxisCallback,
                heightReference: HeightReference.CLAMP_TO_GROUND,
            });
        }

        this.entity = new Entity(entityOptions);
    }

    // --- INTERNAL PHYSICS ---

    /**
     * Helper to convert Cesium Time to JS Date without allocation
     */
    private setScratchDate(time: JulianDate, offsetMs: number = 0): void {
        // (Day - Epoch) * msPerDay + SecondsOfThatDay * 1000 + Offset
        const unixMs = (time.dayNumber - UNIX_EPOCH_JULIAN) * TICKS_PER_DAY
            + (time.secondsOfDay * 1000)
            + offsetMs;
        this.scratchDate.setTime(unixMs);
    }

    private updatePosition(time?: JulianDate, result?: Cartesian3): Cartesian3 | undefined {
        if (!time) return undefined;

        // Zero-Allocation Time Update
        this.setScratchDate(time, 0);

        const gmst = satellite.gstime(this.scratchDate);
        const posVel = satellite.propagate(this.satrec, this.scratchDate);

        if (posVel?.position) {
            const pEci = posVel.position as satellite.EciVec3<number>;
            const pEcf = satellite.eciToEcf(pEci, gmst);

            const target = result || this.scratchPosNow;
            target.x = pEcf.x * 1000;
            target.y = pEcf.y * 1000;
            target.z = pEcf.z * 1000;
            return target;
        }
        return undefined;
    }

    private updateOrientation(time?: JulianDate, result?: Quaternion): Quaternion | undefined {
        if (!time) return undefined;

        // 1. Get Position Now (Reuses scratchDate internally)
        const pNow = this.updatePosition(time, this.scratchPosNow);
        if (!pNow) return undefined;

        // 2. Get Position Next (Add 1000ms offset)
        this.setScratchDate(time, 1000);

        const gmstNext = satellite.gstime(this.scratchDate);
        const pvNext = satellite.propagate(this.satrec, this.scratchDate);

        if (!pvNext?.position) return undefined;

        const pNextEci = pvNext.position as satellite.EciVec3<number>;
        const pNextEcf = satellite.eciToEcf(pNextEci, gmstNext);

        this.scratchPosNext.x = pNextEcf.x * 1000;
        this.scratchPosNext.y = pNextEcf.y * 1000;
        this.scratchPosNext.z = pNextEcf.z * 1000;

        // 3. Velocity & Heading Math
        Cartesian3.subtract(this.scratchPosNext, this.scratchPosNow, this.scratchVel);

        Transforms.eastNorthUpToFixedFrame(this.scratchPosNow, undefined, this.scratchFixedFrame);
        Matrix4.inverse(this.scratchFixedFrame, this.scratchInverse);
        Matrix4.multiplyByPointAsVector(this.scratchInverse, this.scratchVel, this.scratchLocalVel);

        const heading = -Math.atan2(this.scratchLocalVel.y, this.scratchLocalVel.x);

        this.scratchHpr.heading = heading;
        this.scratchHpr.pitch = 0;
        this.scratchHpr.roll = 0;

        const target = result || this.scratchQuaternion;

        return Transforms.headingPitchRollQuaternion(
            this.scratchPosNow,
            this.scratchHpr,
            undefined,
            Transforms.eastNorthUpToFixedFrame,
            target
        );
    }
}