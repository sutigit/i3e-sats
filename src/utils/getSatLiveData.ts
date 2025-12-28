import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  radiansToDegrees,
  twoline2satrec,
  type EciVec3,
} from "satellite.js";
import type { Geodetic, SatLiveData, TLE } from "../types";
import { getCompassDirection } from "./getCompassDirection";

export const getSatLiveData = (
  tle: TLE,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0,
  now: Date
): SatLiveData => {
  // 1. Setup
  // Note: For extreme performance (thousands of sats), cache the 'satrec' object
  // in the Satellite struct instead of recreating it from string every frame.
  const satrec = twoline2satrec(tle.line1, tle.line2);

  const observerGd: Geodetic = {
    latitude: degreesToRadians(observerLat),
    longitude: degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  // 2. Single Propagation (Current Time only)
  const gmst = gstime(now);
  const posVel = propagate(satrec, now);

  // Handle decay or errors gracefully
  if (
    !posVel?.position ||
    !posVel.velocity ||
    typeof posVel.position !== "object"
  ) {
    return {
      speed: 0,
      distance: 0,
      altitude: 0,
      compass: "N",
      azimuth: 0,
      elevation: 0,
    };
  }

  const pEci = posVel.position as EciVec3<number>;
  const vEci = posVel.velocity as EciVec3<number>;

  // 3. Coordinate Transforms
  const pEcf = eciToEcf(pEci, gmst);
  const pGeo = eciToGeodetic(pEci, gmst);
  const look = ecfToLookAngles(observerGd, pEcf);

  // 4. Calculations
  const azimuthDeg = radiansToDegrees(look.azimuth);

  return {
    speed: Math.sqrt(vEci.x ** 2 + vEci.y ** 2 + vEci.z ** 2),
    distance: look.rangeSat, // Slant range in KM
    altitude: pGeo.height, // Height in KM
    compass: getCompassDirection(azimuthDeg),
    azimuth: azimuthDeg,
    elevation: radiansToDegrees(look.elevation),
  };
};
