import { Cartesian3, type Viewer } from "cesium"
import type { Observer, Satellite } from "../types"
import { _drawPath, drawObserver, drawPoint, drawTrail, getOrbitPath, getOrbitPoint } from "./cesiumDraw"

export const addPaths = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPath(s.tle, Date.now())
        _drawPath(path, viewer)
    })
}

export const addTrails = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const path = getOrbitPath(s.tle, Date.now(), 10)
        drawTrail(path, viewer)
    })
}

export const addPoints = ({ satellites, viewer }: { satellites: Satellite[] | undefined, viewer: Viewer }) => {
    if (!satellites) return
    satellites.forEach((s: Satellite) => {
        const point = getOrbitPoint(s.tle, Date.now())
        drawPoint(point, viewer)
    })
}

export const addObserver = ({ observer, viewer }: { observer: Observer, viewer: Viewer }) => {
    const pos = Cartesian3.fromDegrees(observer.lon, observer.lat);
    drawObserver(pos, viewer);
}
