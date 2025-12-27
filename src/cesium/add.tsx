import { Cartesian3 } from "cesium"
import type { ObserverEntity, SatellitesEntity } from "../types"
import { drawObserver } from "./draw"
import { SpaceObjectPrimitive } from "./primitives/SpaceObject"

// SPACE ENTITIES ---------------------------------------------
export const addSatellite3DVisuals = ({ satellites, viewer }: SatellitesEntity): void => {
    if (!satellites) return;
    satellites.forEach((s) => {
        new SpaceObjectPrimitive(s.tle, viewer);
    });
};

// GROUND ENTITIES -----------------------------------------------
export const addObserver = ({ observer, viewer }: ObserverEntity): void => {
    const position = Cartesian3.fromDegrees(observer.lon, observer.lat);
    drawObserver({ id: 'observer-ground', position, viewer });
}