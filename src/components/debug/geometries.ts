import { ArcType, Cartesian3, Color, Entity, Viewer } from "cesium";

const coords = {
  otaniemi: { lon: 24.83, lat: 60.18 },
};

const _position = (offsetLon: number = 0, offsetLat: number = 0) => {
  return Cartesian3.fromDegrees(
    coords["otaniemi"].lon + offsetLon,
    coords["otaniemi"].lat + offsetLat,
    0.0
  );
};

export const box = new Entity({
  position: _position(),
  box: {
    dimensions: new Cartesian3(400000.0, 400000.0, 400000.0),
    material: Color.RED.withAlpha(0.5),
    outline: true,
    outlineColor: Color.BLACK,
  },
});

export const cylinder = new Entity({
  position: _position(),
  cylinder: {
    length: 500000.0, // How tall is it?
    topRadius: 0.0, // 0 = Pointy Cone
    bottomRadius: 150000.0, // Wide base
    material: Color.YELLOW.withAlpha(0.7),
  },
});

export const ellipsoid = new Entity({
  position: _position(),
  ellipsoid: {
    radii: new Cartesian3(200000.0, 200000.0, 200000.0),
    material: Color.BLUE,
  },
});

export const polylineGround = new Entity({
  polyline: {
    positions: Cartesian3.fromDegreesArray([
      24.94,
      60.17, // Helsinki
      100.5,
      13.75, // Bangkok
    ]),

    width: 5,
    material: Color.CYAN,
    clampToGround: true, // Hug the earth
  },
});

export const polylineSpace = new Entity({
  polyline: {
    positions: Cartesian3.fromDegreesArrayHeights([
      24.94,
      60.17,
      2000000.0, // Helsinki
      100.5,
      13.75,
      2000000.0, // Bangkok
    ]),

    width: 2,
    material: Color.RED,

    clampToGround: false, // Don't touch the ground

    // CRITICAL: Force it to curve around the planet
    // Without this, the line cuts through the Earth!
    arcType: ArcType.GEODESIC,
  },
});

export const addShapes = (viewer: Viewer, shapes: Entity[]) => {
  shapes.forEach((shape: Entity) => {
    viewer.entities.add(shape);
  });
};
