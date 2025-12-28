import type { Cartesian3, Quaternion, Viewer } from "cesium";

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

export type VisibilityWindow = {
  startTime: Date;
  endTime: Date;
  startPoint: Location;
  endPoint: Location;
};

export type SatData = {
  location: Location;

  look: {
    azimuth: number; // Degrees (0 to 360)
    compass: string; // Cardinal direction (e.g., "SW", "N")
    elevation: number; // Degrees (-90 to 90). >0 is above horizon.
    range: number; // Km. Slant range (Observer -> Sat).
  };

  physics: {
    speed: number; // km/s. Scalar orbital speed.
    rangeRate: number; // km/s. Doppler shift estimate.
    // Negative (-) = Approaching
    // Positive (+) = Receding

    velocityVector: {
      // km/s. Vector components in ECI frame.
      x: number;
      y: number;
      z: number;
    };
  };

  visibility: {
    visible: boolean;
    visibilityWindow: VisibilityWindow[];
  };
};

export type SatLiveData = {
  speed: number; // km/s. Scalar orbital speed.
  distance: number; // Km. Slant range (Observer -> Sat).
  altitude: number; // Km
  compass: string; // Cardinal direction (e.g., "SW", "N")
  azimuth: number; // Degrees (0 to 360)
  elevation: number; // Degrees (-90 to 90). >0 is above horizon.
};

export type SatelliteCardProps = {
  name: string;
  stat: SatData;
};

export type Satellite = {
  name: string;
  tle: TLE;
  data: SatData;
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

export type PathDrawEntity = {
  id: string;
  path: Cartesian3[];
  viewer: Viewer;
  mode: "space" | "ground";
};

export type PointDrawEntity = {
  id: string;
  position: Cartesian3;
  orientation: Quaternion;
  viewer: Viewer;
  mode: "space" | "ground";
};

export type ObserverDrawEntity = {
  id: string;
  position: Cartesian3;
  viewer: Viewer;
};

// Internal type for satellite.js (missing in library exports)
export interface Geodetic {
  longitude: number;
  latitude: number;
  height: number;
}
