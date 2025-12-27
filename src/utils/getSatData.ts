import * as satellite from "satellite.js";
import type { SatData, TLE } from "../types";

/**
 * Maps an azimuth degree (0-360) to a compass card string (N, NE, etc.).
 */
const getCompassDirection = (azimuthDeg: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azimuthDeg / 45) % 8;
  return directions[index];
};

export const getSatData = (
  tle: TLE,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0
): SatData => {
  // --- 1. INITIALIZATION ---
  const now = new Date();

  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

  const observerGd = {
    latitude: satellite.degreesToRadians(observerLat),
    longitude: satellite.degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  // --- 2. PROPAGATION (ECI) ---
  const gmst = satellite.gstime(now);
  const posVel = satellite.propagate(satrec, now);

  if (!posVel?.position || !posVel?.velocity) {
    throw new Error("Satellite propagation failed (decayed or invalid TLE)");
  }

  // ECI Coordinates (Inertial Frame)
  const positionEci = posVel.position as satellite.EciVec3<number>;
  const velocityEci = posVel.velocity as satellite.EciVec3<number>;

  // --- 3. COORDINATE TRANSFORMS ---
  const positionEcf = satellite.eciToEcf(positionEci, gmst);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

  // --- 4. PHYSICS & DOPPLER ---
  const speed = Math.sqrt(
    velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
  );

  // Range Rate (Doppler) - Delta over 1 second
  const pastDate = new Date(now.getTime() - 1000);
  const pastGmst = satellite.gstime(pastDate);
  const pastPosVel = satellite.propagate(satrec, pastDate);

  let rangeRate = 0;
  if (pastPosVel?.position) {
    const pastPosEci = pastPosVel.position as satellite.EciVec3<number>;
    const pastPosEcf = satellite.eciToEcf(pastPosEci, pastGmst);
    const pastLook = satellite.ecfToLookAngles(observerGd, pastPosEcf);
    rangeRate = lookAngles.rangeSat - pastLook.rangeSat;
  }

  // --- 5. FORMAT & RETURN ---
  const satLatDeg = satellite.degreesLat(positionGd.latitude);
  const satLonDeg = satellite.degreesLong(positionGd.longitude);
  const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth);
  const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation);

  return {
    location: {
      lat: satLatDeg,
      lon: satLonDeg,
      alt: positionGd.height,
    },
    look: {
      azimuth: azimuthDeg,
      compass: getCompassDirection(azimuthDeg),
      elevation: elevationDeg,
      range: lookAngles.rangeSat,
    },
    physics: {
      speed: speed,
      rangeRate: rangeRate,
      velocityVector: {
        x: velocityEci.x,
        y: velocityEci.y,
        z: velocityEci.z,
      },
    },
    status: {
      visible: elevationDeg > 10,
    },
  };
};
