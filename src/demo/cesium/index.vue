<template>
    <div id="cesiumContainer">
    </div>
</template>
<script lang="ts" setup>
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { CESIUM_TOKEN } from './config';
import { onMounted } from 'vue';
import * as Cesium from 'cesium';
import './transform'

Ion.defaultAccessToken = CESIUM_TOKEN

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
onMounted(async () => {
    const viewer = new Viewer('cesiumContainer', {
        terrain: Terrain.fromWorldTerrain(),
    });

    // Fly the camera to San Francisco at the given longitude, latitude, and height.
    viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(117.47381507483506, 34.398499146435206, 400),
        // orientation: {
        //     heading: CesiumMath.toRadians(0.0),
        //     pitch: CesiumMath.toRadians(-15.0),
        // }
    });

    // Add Cesium OSM Buildings, a global 3D buildings layer.
    const buildingTileset = await createOsmBuildingsAsync();
    viewer.scene.primitives.add(buildingTileset);
})

</script>

<style lang="less" scoped>
#cesiumContainer {
    width: 100%;
    height: 100%;
}
</style>