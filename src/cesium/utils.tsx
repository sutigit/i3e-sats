import {
    Cartesian3,
    Matrix4,
    Quaternion,
    Transforms,
    HeadingPitchRoll,
    Math as CesiumMath
} from "cesium";
import * as satellite from "satellite.js";
import type { TLE } from "../types";

/**
 * Helper: Pure Math to get Fixed Frame (ECF) coordinates.
 * Returns a simple {x, y, z} object in meters (not Cartesian3 yet to save allocs).
 */
const _getEcfFixed = (satrec: satellite.SatRec, date: Date) => {
    const gmst = satellite.gstime(date);
    const posVel = satellite.propagate(satrec, date);

    if (!posVel?.position) {
        return null;
    }

    const positionEci = posVel.position as satellite.EciVec3<number>;

    // ECI (Inertial) -> ECF (Fixed)
    // This rotates the coordinate frame to match the spinning Earth.
    const positionEcf = satellite.eciToEcf(positionEci, gmst);

    return {
        x: positionEcf.x * 1000, // km -> meters
        y: positionEcf.y * 1000,
        z: positionEcf.z * 1000
    };
};

/**
 * Calculates the exact Position and Orientation for a satellite.
 * Orientation: Faces velocity vector (Heading), with "Belly" facing Earth.
 */
export const getOrbitPositionOrientation = (
    tle: TLE,
    time: number // Unix Timestamp (ms)
): { position: Cartesian3, orientation: Quaternion } | null => {

    // 1. Setup (Direct access, no parsing needed)
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    const now = new Date(time);
    const next = new Date(time + 1000); // 1 second lookahead

    // 2. Get Positions (ECF)
    const posNow = _getEcfFixed(satrec, now);
    const posNext = _getEcfFixed(satrec, next);

    if (!posNow || !posNext) return null;

    // 3. Convert to Cesium Types
    const position = new Cartesian3(posNow.x, posNow.y, posNow.z);
    const positionNext = new Cartesian3(posNext.x, posNext.y, posNext.z);

    // 4. Calculate Velocity Vector (Fixed Frame)
    const velocityVector = new Cartesian3();
    Cartesian3.subtract(positionNext, position, velocityVector);

    // 5. Compute Orientation (Heading + Belly Down)

    // A. Get Local Frame (ENU)
    const fixedFrameTransform = Transforms.eastNorthUpToFixedFrame(position);
    const inverseTransform = new Matrix4();
    Matrix4.inverse(fixedFrameTransform, inverseTransform);

    // B. Transform Velocity to Local Frame
    const vLocal = new Cartesian3();
    Matrix4.multiplyByPointAsVector(inverseTransform, velocityVector, vLocal);

    // C. Calculate Heading (-atan2 for Cesium CW rotation)
    const heading = -Math.atan2(vLocal.y, vLocal.x);

    // D. Create Quaternion
    const hpr = new HeadingPitchRoll(heading, 0, 0);
    const orientation = Transforms.headingPitchRollQuaternion(position, hpr);

    return { position, orientation };
};

/**
 * Generates the orbit path trace.
 * Optimally reuses the satrec object for the entire loop.
 */
export const getOrbitPath = (
    tle: TLE,
    nowTime: number,
    lastMins: number = 97
): Cartesian3[] => {
    const positions: Cartesian3[] = [];
    const stepInMinutes = 1;

    // 1. Setup (Parse ONCE)
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    // 2. Loop
    for (let i = -lastMins; i <= 0; i += stepInMinutes) {
        const loopTime = new Date(nowTime + (i * 60000));

        // Direct ECI -> ECF -> XYZ
        const pos = _getEcfFixed(satrec, loopTime);

        if (pos) {
            positions.push(new Cartesian3(pos.x, pos.y, pos.z));
        }
    }

    return positions;
};

export const getMinimapViewConfig = (lon: number, lat: number, alt: number) => {
    const viewConfig = {
        destination: Cartesian3.fromDegrees(lon, lat, alt),
        orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-90.0),
            roll: CesiumMath.toRadians(0.0)
        },
    }
    return viewConfig
}