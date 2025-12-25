import { Cartesian3, type Viewer } from "cesium"
import type { Observer, Satellite } from "../types"
import { _drawPath, drawObserver, drawPoint, drawTrail } from "./draw"
import { getOrbitPathSpace, getOrbitPointSpace } from "./utils"

export const addSatellitePathsSpace = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPathSpace(s.tle, Date.now())
        _drawPath(path, viewer)
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
        const point = getOrbitPointSpace(s.tle, Date.now())
        drawPoint(point, viewer)
    })
}

export const addObserverGround = ({ observer, viewer }: { observer: Observer, viewer: Viewer }) => {
    const pos = Cartesian3.fromDegrees(observer.lon, observer.lat);
    drawObserver(pos, viewer);
}
