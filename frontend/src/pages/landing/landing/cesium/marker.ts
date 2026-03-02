import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { Marker } from './cesium.types';

export function addMarker(viewer: Cesium.Viewer, m: Marker) {
  const pos = Cesium.Cartesian3.fromDegrees(m.lon, m.lat, 0);
  const pin =
    m.imageUrl ||
    new Cesium.PinBuilder().fromColor(Cesium.Color.WHITE, 40).toDataURL();

  viewer.entities.add({
    id: m.id,
    position: pos,
    billboard: {
      image: pin,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      scale: 1,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: m.label
      ? {
          text: m.label,
          font: '14px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, -45),
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.6),
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        }
      : undefined,
    properties: new Cesium.PropertyBag({ isCustomMarker: true }),
  });
}
