import { Cartesian3 } from "cesium";
import { getSatelliteInfo, type SatelliteInfoOutput, type Timestamp } from "tle.js";
import type { TLE } from "../types";

const _infoToCartesian3 = (info: SatelliteInfoOutput) => {
    return Cartesian3.fromDegrees(
        info.lng,
        info.lat,
        info.height * 1000 // km to meters
    );
}

export const getOrbitPath = (tleLine: TLE["tle"], now: Timestamp, lastMins: number = 97): Cartesian3[] => {
    const positions: Cartesian3[] = [];
    const stepInMinutes = 1;
    const durationMinutes = lastMins; // // default 97 min ICEYE satellite approximate orbit duration

    for (let i = -durationMinutes; i <= 0; i += stepInMinutes) {
        const timestamp = now + (i * 60000); // i is negative, so this subtracts time
        const info = getSatelliteInfo(tleLine, timestamp);

        if (info && info.height) {

            if (info.height < 100) {
                console.warn("⚠️ Satellite is crashing!", info.height);
            }

            const pos = _infoToCartesian3(info)
            positions.push(pos);
        }
    }
    return positions;
}

export const getOrbitPoint = (tleLine: TLE["tle"], now: Timestamp): Cartesian3 => {
    const info = getSatelliteInfo(tleLine, now);
    return _infoToCartesian3(info)
}