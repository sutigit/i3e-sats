import {
  Viewer,
  BillboardCollection,
  Billboard,
  Cartesian3,
  Color,
  VerticalOrigin,
  HorizontalOrigin,
} from "cesium";
import { observerSVG } from "../icons";

export interface ObserverPosition {
  lat: number;
  lon: number;
  alt?: number; // Optional, defaults to 0
}

export class ObserverPrimitive {
  private _viewer: Viewer;
  private _billboardCollection: BillboardCollection;
  private _billboard: Billboard;

  constructor(viewer: Viewer, position: ObserverPosition) {
    this._viewer = viewer;

    // 1. Create the Collection
    // BillboardCollection is the most efficient way to manage 2D icons
    this._billboardCollection = new BillboardCollection();

    // 2. Add to Scene Primitives immediately
    this._viewer.scene.primitives.add(this._billboardCollection);

    // 3. Create the Billboard
    this._billboard = this._billboardCollection.add({
      position: Cartesian3.fromDegrees(
        position.lon,
        position.lat,
        position.alt || 0
      ),
      image: observerSVG,
      scale: 0.6, // SVGs usually render large, scale down if needed (e.g. 0.8)
      verticalOrigin: VerticalOrigin.BOTTOM, // The tripod feet sit on the ground
      horizontalOrigin: HorizontalOrigin.CENTER,
      color: Color.WHITE, // Tinting (White = Original SVG Colors)
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // Always render on top (UI style)
    });
  }

  /**
   * Updates the location if the observer moves
   */
  public setLocation(lat: number, lon: number, alt: number = 0) {
    this._billboard.position = Cartesian3.fromDegrees(lon, lat, alt);
  }

  /**
   * Hides or Shows the observer
   */
  public set visible(val: boolean) {
    this._billboard.show = val;
  }

  /**
   * Clean up
   */
  public destroy() {
    // Remove the entire collection from the scene
    this._viewer.scene.primitives.remove(this._billboardCollection);
    // Destroy internal resources
    if (!this._billboardCollection.isDestroyed()) {
      this._billboardCollection.destroy();
    }
  }
}
