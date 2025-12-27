import {
    Entity,
    Cartesian3,
    Quaternion,
    HeadingPitchRoll,
    Matrix4,
    CallbackProperty,
    CallbackPositionProperty,
    SampledProperty,
    Color,
    HeightReference,
    Math as CesiumMath,
    JulianDate,
    Transforms,
    BoxGraphics,
    BillboardGraphics,
    LinearApproximation
} from "cesium";
import * as satellite from "satellite.js";
import type { TLE } from "../../types";
import { satelliteSVG } from "../icons";

const SATELLITE_ICON = satelliteSVG;

export class PointEntity {
    public readonly entity: Entity;

    // --- Private State ---
    private readonly satrec: satellite.SatRec;

    // --- Scratch Variables (Zero-Allocation) ---
    private readonly scratchPosNow = new Cartesian3();
    private readonly scratchQ = new Quaternion();
    private readonly scratchHpr = new HeadingPitchRoll();
    private readonly scratchAxis = new Cartesian3();

    constructor(
        id: string,
        tle: TLE,
        mode: "space" | "ground",
        startTime: Date = new Date()
    ) {
        this.satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        // --- 1. DEFINE PHYSICS (The "Model") ---
        // These are the Single Sources of Truth for this object.

        const position = new CallbackPositionProperty(
            this.updatePosition.bind(this),
            false
        );

        // Generate 1 day (1440 mins) of orientation samples
        const orientation = this.generateOrientationSamples(startTime, 1440);


        // --- 2. CONFIGURE ENTITY (The Container) ---
        const entityOptions: Entity.ConstructorOptions = {
            id,
            position,    // The Entity physically is here
            orientation, // The Entity physically faces this way
        };


        // --- 3. CONFIGURE VISUALS (The "View") ---
        if (mode === "space") {
            // Box automatically uses the entity.position and entity.orientation
            entityOptions.box = new BoxGraphics({
                dimensions: new Cartesian3(50000.0, 50000.0, 50000.0),
                material: Color.fromCssColorString("#5eead4").withAlpha(0.3),
                outline: true,
                outlineColor: Color.fromCssColorString("#ccfbf1"),
            });
        }
        else {
            // Billboards need a derived "Rotation Angle" (Number), not a Quaternion.
            // We pass our physics properties to the helper to bridge this gap.
            entityOptions.billboard = this.createBillboardGraphics(
                orientation, // Pass the source of truth
                position     // Pass the source of truth
            );
        }

        this.entity = new Entity(entityOptions);
    }

    /**
     * Calculates the satellite position for a specific time frame.
     * Uses Cesium's Date converter to handle Leap Seconds (TAI vs UTC) correctly.
     */
    private updatePosition(time?: JulianDate, result?: Cartesian3): Cartesian3 | undefined {
        if (!time) return undefined;

        // CRITICAL: Fix for 37-second offset
        const dateNow = JulianDate.toDate(time);

        const gmst = satellite.gstime(dateNow);
        const posVel = satellite.propagate(this.satrec, dateNow);

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

    /**
     * Generates sparse orientation samples for the next [durationMins] minutes.
     * This avoids heavy math per-frame.
     */
    private generateOrientationSamples(startDate: Date, durationMins: number): SampledProperty {
        const property = new SampledProperty(Quaternion);
        property.setInterpolationOptions({
            interpolationDegree: 1,
            interpolationAlgorithm: LinearApproximation
        });

        const stepSeconds = 60; // 1 Sample per minute is sufficient for orbit orientation

        // Local scratch variables for the loop
        const tDate = new Date(startDate);
        const posNow = new Cartesian3();
        const posNext = new Cartesian3();
        const vel = new Cartesian3();
        const fixedFrame = new Matrix4();
        const inverse = new Matrix4();
        const localVel = new Cartesian3();
        const hpr = new HeadingPitchRoll(0, 0, 0);
        const quat = new Quaternion();

        for (let i = 0; i <= durationMins * 60; i += stepSeconds) {
            // A. Update Time
            tDate.setTime(startDate.getTime() + (i * 1000));
            const cesiumTime = JulianDate.fromDate(tDate);
            const gmst = satellite.gstime(tDate);

            // B. Get Position Now
            const pvNow = satellite.propagate(this.satrec, tDate);
            if (!pvNow?.position) continue;

            const pEci = pvNow.position as satellite.EciVec3<number>;
            const pEcf = satellite.eciToEcf(pEci, gmst);
            posNow.x = pEcf.x * 1000;
            posNow.y = pEcf.y * 1000;
            posNow.z = pEcf.z * 1000;

            // C. Get Position Next (Forward Look for Velocity)
            const tNext = new Date(tDate.getTime() + 1000);
            const gNext = satellite.gstime(tNext);
            const pvNext = satellite.propagate(this.satrec, tNext);
            if (!pvNext?.position) continue;

            const pnEci = pvNext.position as satellite.EciVec3<number>;
            const pnEcf = satellite.eciToEcf(pnEci, gNext);
            posNext.x = pnEcf.x * 1000;
            posNext.y = pnEcf.y * 1000;
            posNext.z = pnEcf.z * 1000;

            // D. Calculate Orientation (Belly Down)
            Cartesian3.subtract(posNext, posNow, vel);
            Transforms.eastNorthUpToFixedFrame(posNow, undefined, fixedFrame);
            Matrix4.inverse(fixedFrame, inverse);
            Matrix4.multiplyByPointAsVector(inverse, vel, localVel);

            const heading = -Math.atan2(localVel.y, localVel.x);
            hpr.heading = heading;

            Transforms.headingPitchRollQuaternion(
                posNow,
                hpr,
                undefined,
                Transforms.eastNorthUpToFixedFrame,
                quat
            );

            property.addSample(cesiumTime, quat);
        }

        return property;
    }

    /**
     * Helper to configure the Billboard (Ground Mode)
     * which requires extracting Rotation from the Orientation Property.
     */
    private createBillboardGraphics(
        orientationProp: SampledProperty,
        positionProp: CallbackPositionProperty
    ): BillboardGraphics {

        // 1. Rotation Callback (Fast extraction from samples)
        const rotationCallback = new CallbackProperty((time, _) => {
            const q = orientationProp.getValue(time, this.scratchQ);
            if (!q) return 0;

            const hpr = HeadingPitchRoll.fromQuaternion(q, this.scratchHpr);
            return -hpr.heading + CesiumMath.PI_OVER_TWO;
        }, false);

        // 2. Alignment Callback (Locks to surface)
        const alignedAxisCallback = new CallbackProperty((time, result) => {
            const pos = positionProp.getValue(time, this.scratchPosNow);
            return pos ? Cartesian3.normalize(pos, result || this.scratchAxis) : undefined;
        }, false);

        return new BillboardGraphics({
            image: SATELLITE_ICON,
            width: 14,
            height: 14,
            rotation: rotationCallback,
            alignedAxis: alignedAxisCallback,
            heightReference: HeightReference.CLAMP_TO_GROUND,
        });
    }
}