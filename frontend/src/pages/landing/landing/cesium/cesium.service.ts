import * as Cesium from 'cesium';

// let viewer: Cesium.Viewer | null = null;
// let initialized = false;

// async function setBaseLayer(assetId: number) {
//   let baseLayer: Cesium.ImageryLayer | null = null;

//   if (!viewer) return;

//   // Remove previous layer if exists
//   if (baseLayer) {
//     viewer.imageryLayers.remove(baseLayer, true);
//     baseLayer = null;
//   }

//   // Add new layer
//   const provider = await Cesium.IonImageryProvider.fromAssetId(assetId);
//   baseLayer = viewer.imageryLayers.addImageryProvider(provider);
// }

export async function createCesiumViewer(container: HTMLDivElement) {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_API_KEY;

  const viewer = new Cesium.Viewer(container, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    geocoder: false,
    homeButton: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    terrainProvider: await Cesium.createWorldTerrainAsync(),
  });

  viewer.imageryLayers.removeAll();
  await setBaseLayer(viewer, 2);

  viewer.scene.globe.enableLighting = true;
  viewer.scene.globe.depthTestAgainstTerrain = true;

  const lon = 124.605293;
  const lat = 11.009971;
  const panRight = -5000000;
  const endHeight = 5000;

  viewer.camera.moveRight(panRight);
  animatedZoomInSequence(viewer, lon, lat, endHeight);

  // hide credits
  const creditContainer = (viewer as any)._cesiumWidget
    ._creditContainer as HTMLDivElement;
  creditContainer.style.display = 'none';

  return viewer;
}

async function setBaseLayer(viewer: Cesium.Viewer, assetId: number) {
  const provider = await Cesium.IonImageryProvider.fromAssetId(assetId);
  viewer.imageryLayers.addImageryProvider(provider);
}

function animatedZoomInSequence(
  viewer: Cesium.Viewer,
  lon: number,
  lat: number,
  endHeight: number,
) {
  setTimeout(() => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        lon + 3,
        lat + 3,
        endHeight * 13,
      ),
      orientation: {
        heading: viewer.camera.heading,
        pitch: viewer.camera.pitch,
        roll: viewer.camera.roll,
      },
      duration: 10,
    });

    setTimeout(() => {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, endHeight),
        orientation: {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll,
        },
        duration: 5,
        complete: () => {
          setBaseLayer(viewer, 3);
        },
      });
    }, 3000);
  }, 3000);
}
