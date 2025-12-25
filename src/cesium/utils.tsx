import { Cartesian3, Matrix4, Quaternion, Transforms, HeadingPitchRoll } from "cesium";
import { getSatelliteInfo, type SatelliteInfoOutput, type Timestamp } from "tle.js";
import type { TLE } from "../types";

const _getVelocityVector = (tle: string, time: number): Cartesian3 => {
    // 1. Get positions 1 second apart
    const now = getSatelliteInfo(tle, time);
    const next = getSatelliteInfo(tle, time + 1000);

    // 2. Convert to Cesium Cartesian3 (Earth Fixed)
    const p1 = Cartesian3.fromDegrees(now.lng, now.lat, now.height * 1000);
    const p2 = Cartesian3.fromDegrees(next.lng, next.lat, next.height * 1000);

    // 3. Calculate Vector (p2 - p1)
    return Cartesian3.subtract(p2, p1, new Cartesian3());
};

const _getPosition = (info: SatelliteInfoOutput) => {
    return Cartesian3.fromDegrees(
        info.lng,
        info.lat,
        info.height * 1000 // km to meters
    );
}

const _getOrientation = (
    info: SatelliteInfoOutput,
    velocityVector: Cartesian3
): Quaternion => {

    // 1. Get Position (Cesium World Coords)
    // info.height is km, convert to meters
    const position = Cartesian3.fromDegrees(info.lng, info.lat, info.height * 1000);

    // 2. Transform Velocity to Local Frame (ENU)
    // Local: X=East, Y=North, Z=Up
    const toLocal = Matrix4.inverse(Transforms.eastNorthUpToFixedFrame(position), new Matrix4());
    const vLocal = Matrix4.multiplyByPointAsVector(toLocal, velocityVector, new Cartesian3());

    // 3. Compute Heading (Yaw)
    // Math.atan2(y, x) = Angle from East (Counter-Clockwise).
    // Cesium Heading  = Rotation around Negative-Z (Clockwise).
    //
    // We simply NEGATE the math angle to convert CCW -> CW.
    // Examples:
    // - Velocity East (0°):  -atan2(0, 1) = -0   -> Points East (Correct)
    // - Velocity North (90°): -atan2(1, 0) = -90  -> Rotates 90° CCW -> Points North (Correct)
    const heading = -Math.atan2(vLocal.y, vLocal.x);

    // 4. Force "Belly Down"
    // Pitch=0, Roll=0 ensures the local Z-axis matches the global Up-axis.
    // The cube glides parallel to the curve of the earth.
    return Transforms.headingPitchRollQuaternion(
        position,
        new HeadingPitchRoll(heading, 0, 0)
    );
}

export const getOrbitPath = (tle: TLE["tle"], now: Timestamp, lastMins: number = 97): Cartesian3[] => {
    const positions: Cartesian3[] = [];
    const stepInMinutes = 1;
    const durationMinutes = lastMins; // // default 97 min ICEYE satellite approximate orbit duration

    for (let i = -durationMinutes; i <= 0; i += stepInMinutes) {
        const timestamp = now + (i * 60000); // i is negative, so this subtracts time
        const info = getSatelliteInfo(tle, timestamp);

        if (info && info.height) {

            if (info.height < 100) {
                console.warn("⚠️ Satellite is crashing!", info.height);
            }

            const pos = _getPosition(info)
            positions.push(pos);
        }
    }
    return positions;
}

export const getOrbitPositionOrientation = (tle: TLE["tle"], now: Timestamp): { position: Cartesian3, orientation: Quaternion } => {
    const info = getSatelliteInfo(tle, now);
    const velocity = _getVelocityVector(tle, now)
    const position = _getPosition(info)
    const orientation = _getOrientation(info, velocity)
    return { position, orientation }
}