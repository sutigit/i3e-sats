import * as satellite from "satellite.js";
import type { SatStat, TLE } from "../types";

/**
 * Maps an azimuth degree (0-360) to a compass card string (N, NE, etc.).
 */
const getCompassDirection = (azimuthDeg: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azimuthDeg / 45) % 8;
  return directions[index];
};

export const getSatStats = (
  tle: TLE,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0
): SatStat => {
  // --- 1. INITIALIZATION ---
  const now = new Date();

  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

  // Configure Observer: Convert input (Degrees/Meters) to Lib Units (Radians/KM)
  const observerGd = {
    latitude: satellite.degreesToRadians(observerLat),
    longitude: satellite.degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  // --- 2. PROPAGATION (ECI) ---
  // Propagate satellite physics to current time
  const gmst = satellite.gstime(now);
  const posVel = satellite.propagate(satrec, now);

  if (!posVel?.position || !posVel?.velocity) {
    throw new Error("Satellite propagation failed (decayed or invalid TLE)");
  }

  // Extract Earth-Centered Inertial (ECI) coordinates
  const positionEci = posVel.position as satellite.EciVec3<number>;
  const velocityEci = posVel.velocity as satellite.EciVec3<number>;

  // --- 3. COORDINATE TRANSFORMS ---
  // Convert ECI (Inertial) -> ECF (Fixed/Rotating Earth) -> Geodetic (Lat/Lon)
  const positionEcf = satellite.eciToEcf(positionEci, gmst);
  const positionGd = satellite.eciToGeodetic(positionEci, gmst);

  // Calculate Look Angles (Azimuth, Elevation, Slant Range) relative to Observer
  const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

  // --- 4. PHYSICS & DOPPLER ---
  // Orbital Speed (Scalar magnitude of velocity vector)
  const speed = Math.sqrt(
    velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
  );

  // Range Rate (Doppler): Calculate delta range over 1 second (t - 1s)
  // Negative = approaching, Positive = receding
  const pastDate = new Date(now.getTime() - 1000);
  const pastGmst = satellite.gstime(pastDate);
  const pastPosVel = satellite.propagate(satrec, pastDate);

  let rangeRate = 0;
  if (pastPosVel?.position) {
    const pastPosEci = pastPosVel.position as satellite.EciVec3<number>;
    const pastPosEcf = satellite.eciToEcf(pastPosEci, pastGmst);
    const pastLook = satellite.ecfToLookAngles(observerGd, pastPosEcf);
    rangeRate = lookAngles.rangeSat - pastLook.rangeSat; // km/s
  }

  // --- 5. FORMAT & RETURN ---
  // Normalize units back to standard Degrees & KM for UI consumption
  const satLatDeg = satellite.degreesLat(positionGd.latitude);
  const satLonDeg = satellite.degreesLong(positionGd.longitude);
  const azimuthDeg = satellite.radiansToDegrees(lookAngles.azimuth);
  const elevationDeg = satellite.radiansToDegrees(lookAngles.elevation);

  return {
    location: {
      lat: satLatDeg,
      lon: satLonDeg,
      altitude: positionGd.height,
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
    },
    status: {
      visible: elevationDeg > 10, // Simple horizon check
    },
  };
};
