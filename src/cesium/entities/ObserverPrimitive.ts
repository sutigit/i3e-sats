import {
  Viewer,
  BillboardCollection,
  Billboard,
  Cartesian3,
  Color,
  VerticalOrigin,
  HorizontalOrigin,
} from "cesium";
import { pinSVG } from "../icons";

export interface ObserverPosition {
  lat: number;
  lon: number;
  alt?: number;
}

export class ObserverPrimitive {
  private _viewer: Viewer;
  private _billboardCollection: BillboardCollection;
  private _billboard: Billboard;

  constructor(viewer: Viewer, position: ObserverPosition) {
    this._viewer = viewer;

    this._billboardCollection = new BillboardCollection();

    this._viewer.scene.primitives.add(this._billboardCollection);

    this._billboard = this._billboardCollection.add({
      position: Cartesian3.fromDegrees(
        position.lon,
        position.lat,
        position.alt || 0
      ),
      image: pinSVG,
      scale: 0.4,
      verticalOrigin: VerticalOrigin.BOTTOM,
      horizontalOrigin: HorizontalOrigin.CENTER,
      color: Color.WHITE,
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // Always render on top (UI style)
    });
  }

  public setLocation(lat: number, lon: number, alt: number = 0) {
    this._billboard.position = Cartesian3.fromDegrees(lon, lat, alt);
  }

  public set visible(val: boolean) {
    this._billboard.show = val;
  }

  public destroy() {
    this._viewer.scene.primitives.remove(this._billboardCollection);
    if (!this._billboardCollection.isDestroyed()) {
      this._billboardCollection.destroy();
    }
  }
}
