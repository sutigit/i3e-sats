import type { ObserverEntity, SatellitesEntity } from "../types"
import { SpaceObjectComposition3D } from "./entities/SpaceObjectComposition3D"
import { SpaceObjectComposition2D } from "./entities/SpaceObjectComposition2D";
import { ObserverPrimitive } from "./entities/ObserverPrimitive";

export const addSatelliteVisuals3D = ({ satellites, viewer }: SatellitesEntity): void => {
    if (!satellites) return;
    satellites.forEach((s) => {
        new SpaceObjectComposition3D(s.tle, viewer);
    });
};

export const addSatelliteVisuals2D = ({ satellites, viewer }: SatellitesEntity): void => {
    if (!satellites) return;
    satellites.forEach((s) => {
        new SpaceObjectComposition2D(s.tle, viewer);
    });
};

export const addObserver = ({ observer, viewer }: ObserverEntity): void => {
    new ObserverPrimitive(viewer, {
        lat: observer.lat,
        lon: observer.lon
    });
}