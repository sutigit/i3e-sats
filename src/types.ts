import type { Viewer } from "cesium";

export type TLE = {
  name: string;
  line1: string;
  line2: string;
  full: string;
};

export type Location = {
  lat: number; // Degrees (-90 to 90)
  lon: number; // Degrees (-180 to 180)
  alt: number; // Kilometers (km)
};

export type LookPoint = {
  location: Location;
  velocity: { x: number; y: number; z: number };
};

export type VisibilityWindow = {
  startTime: Date;
  endTime: Date;
  startPoint: Location;
  endPoint: Location;
  lookPoints: LookPoint[];
};

export type SatVisibilityData = {
  visible: boolean;
  visibilityWindow: VisibilityWindow[];
};

export type Satellite = {
  name: string;
  tle: TLE;
  visibility: SatVisibilityData;
};

export type SatLiveData = {
  speed: number; // km/s. Scalar orbital speed.
  distance: number; // Km. Slant range (Observer -> Sat).
  altitude: number; // Km
  compass: string; // Cardinal direction (e.g., "SW", "N")
  azimuth: number; // Degrees (0 to 360)
  elevation: number; // Degrees (-90 to 90). >0 is above horizon.
};

export type Observer = {
  lon: number;
  lat: number;
};

export type SatellitesEntity = {
  satellites: Satellite[] | undefined;
  viewer: Viewer;
};

export type ObserverEntity = { observer: Observer; viewer: Viewer };

// Internal type for satellite.js (missing in library exports)
export interface Geodetic {
  longitude: number;
  latitude: number;
  height: number;
}
