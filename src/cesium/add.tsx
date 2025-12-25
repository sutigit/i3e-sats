import { Cartesian3, type Viewer } from "cesium"
import type { Observer, Satellite } from "../types"
import { drawPath, drawObserver, drawPoint, drawTrail } from "./draw"
import { getOrbitPath, getOrbitPositionOrientation } from "./utils"


// SPACE ENTITIES ---------------------------------------------
export const addSatellitePathsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((satellite: Satellite) => {
        const path = getOrbitPath(satellite.tle, Date.now())
        drawPath(path, viewer, "space")
    })
}

export const addSatelliteTrailsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((satellite: Satellite) => {
        const path = getOrbitPath(satellite.tle, Date.now(), 10)
        drawTrail(path, viewer, "space")
    })
}

export const addSatellitePointsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((satellite: Satellite) => {
        const { position, orientation } = getOrbitPositionOrientation(satellite.tle, Date.now())
        drawPoint(position, orientation, viewer, "space")
    })
}

// GROUND ENTITIES -----------------------------------------------
export const addObserverGround = ({ observer, viewer }: { observer: Observer, viewer: Viewer }) => {
    const position = Cartesian3.fromDegrees(observer.lon, observer.lat);
    drawObserver(position, viewer);
}

export const addSatellitePathGround = ({ satellite, viewer }: { satellite: Satellite | undefined, viewer: Viewer }) => {
    if (!satellite) return
    const path = getOrbitPath(satellite.tle, Date.now())
    drawPath(path, viewer, "ground")
}

export const addSatelliteTrailGround = ({ satellite, viewer }: { satellite: Satellite | undefined, viewer: Viewer }) => {
    if (!satellite) return
    const path = getOrbitPath(satellite.tle, Date.now(), 10)
    drawTrail(path, viewer, "ground")
}

export const addSatellitePointGround = ({ satellite, viewer }: { satellite: Satellite | undefined, viewer: Viewer }) => {
    if (!satellite) return
    const { position, orientation } = getOrbitPositionOrientation(satellite.tle, Date.now())
    drawPoint(position, orientation, viewer, "ground")
}
