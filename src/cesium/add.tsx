import { Cartesian3 } from "cesium"
import type { ObserverEntity, Satellite, SatellitesEntity } from "../types"
import { drawPath, drawObserver, drawPoint, drawTrail } from "./draw"
import { getOrbitPath, getOrbitPositionOrientation } from "./utils"

// SPACE ENTITIES ---------------------------------------------
export const addSatellitePathsSpace = ({ satellites, viewer }: SatellitesEntity) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPath(s.tle, Date.now())
        drawPath({ id: `${s.name}-path-space`, path, viewer, mode: "space" })
    })
}

export const addSatelliteTrailsSpace = ({ satellites, viewer }: SatellitesEntity) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPath(s.tle, Date.now(), 10)
        drawTrail({ id: `${s.name}-trail-space`, path, viewer, mode: "space" })
    })
}

export const addSatellitePointsSpace = ({ satellites, viewer }: SatellitesEntity) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const { position, orientation } = getOrbitPositionOrientation(s.tle, Date.now())
        drawPoint({ id: `${s.name}-point-space`, position, orientation, viewer, mode: "space" })
    })
}

// GROUND ENTITIES -----------------------------------------------
export const addObserverGround = ({ observer, viewer }: ObserverEntity) => {
    const position = Cartesian3.fromDegrees(observer.lon, observer.lat);
    drawObserver({ id: 'observer-ground', position, viewer });
}

export const addSatellitePathsGround = ({ satellites, viewer }: SatellitesEntity) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPath(s.tle, Date.now())
        drawPath({ id: `${s.name}-path-ground`, path, viewer, mode: "ground" })
    })
}

export const addSatelliteTrailsGround = ({ satellites, viewer }: SatellitesEntity) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPath(s.tle, Date.now(), 10)
        drawTrail({ id: `${s.name}-trail-ground`, path, viewer, mode: "ground" })
    })
}

export const addSatellitePointsGround = ({ satellites, viewer }: SatellitesEntity) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const { position, orientation } = getOrbitPositionOrientation(s.tle, Date.now())
        drawPoint({ id: `${s.name}-point-ground`, position, orientation, viewer, mode: "ground" })
    })
}
