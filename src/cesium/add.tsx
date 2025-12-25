import { Cartesian3, type Viewer } from "cesium"
import type { Observer, Satellite } from "../types"
import { drawPath, drawObserver, drawPoint, drawTrail } from "./draw"
import { getOrbitPathSpace, getOrbitPositionOrientationSpace } from "./utils"

export const addSatellitePathsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPathSpace(s.tle, Date.now())
        drawPath(path, viewer, "space")
    })
}

export const addSatelliteTrailsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPathSpace(s.tle, Date.now(), 10)
        drawTrail(path, viewer)
    })
}

export const addSatellitePointsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const { position, orientation } = getOrbitPositionOrientationSpace(s.tle, Date.now())
        drawPoint(position, orientation, viewer)
    })
}

export const addObserverGround = ({ observer, viewer }: { observer: Observer, viewer: Viewer }) => {
    const position = Cartesian3.fromDegrees(observer.lon, observer.lat);
    drawObserver(position, viewer);
}
