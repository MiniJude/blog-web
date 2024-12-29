<template>
    <div id="cesiumContainer">
    </div>
</template>
<script lang="ts" setup>
import { Cartesian3, createOsmBuildingsAsync, Ion, Math as CesiumMath, Terrain, Viewer, Entity, JulianDate, TimeIntervalCollection, TimeInterval, SampledPositionProperty, VelocityOrientationProperty, ClockRange } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { CESIUM_TOKEN } from './config';
import { onMounted, onUnmounted } from 'vue';
import T90 from '@/assets/models/T90.glb?url'

Ion.defaultAccessToken = CESIUM_TOKEN

// 模拟服务器数据
function mockServerData() {
    // 这里用随机值模拟车辆移动，实际使用时替换为真实的服务器数据
    return {
        longitude: 86.925 + Math.random() * 0.0001,
        latitude: 27.988 + Math.random() * 0.0001,
        height: 8848,
        heading: Math.random() * 360
    }
}

let viewer: Viewer;
let vehicleEntity: Entity;
const positionProperty = new SampledPositionProperty();
let intervalId: number;

onMounted(async () => {
    viewer = new Viewer('cesiumContainer', {
        terrain: Terrain.fromWorldTerrain(),
        shouldAnimate: true,
    });

    // 设置初始时间
    const start = JulianDate.now();
    viewer.clock.startTime = start;
    viewer.clock.currentTime = start;
    viewer.clock.stopTime = JulianDate.addSeconds(start, 3600, new JulianDate());
    viewer.clock.clockRange = ClockRange.LOOP_STOP;

    // 添加初始位置样本
    positionProperty.addSample(
        start,
        Cartesian3.fromDegrees(86.925, 27.988, 8848)
    );

    vehicleEntity = viewer.entities.add({
        // position: positionProperty,
        position: Cartesian3.fromDegrees(86.925, 27.988, 8848),
        model: {
            uri: T90,
            scale: 4000.0
        },
        orientation: new VelocityOrientationProperty(positionProperty)
    });

    // 设置相机视角，以更好地观察山脉
    viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(86.925, 27.500, 88000),  // 增加高度以便观察
        orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-60),  // 调整俯仰角以更好地观察地形
            roll: 0
        }
    });

    // 设置时间轴
    viewer.clock.shouldAnimate = true;
    viewer.clock.multiplier = 1; // 时间流速

    // 每2秒更新一次位置
    intervalId = window.setInterval(() => {
        const data = mockServerData();
        updateVehiclePosition(data);
    }, 2000);

    console.log('Model path:', T90);
})

// 更新车辆位置
function updateVehiclePosition(data: { longitude: number; latitude: number; height: number; heading: number }) {
    console.log(data)
    const time = JulianDate.now();
    const position = Cartesian3.fromDegrees(data.longitude, data.latitude, data.height);

    // 添加新的采样点
    positionProperty.addSample(time, position);

    // 设置视图时间
    viewer.clock.currentTime = time;

    // 设置相机跟踪实体
    // viewer.trackedEntity = vehicleEntity;
}

// 组件卸载时清理定时器
onUnmounted(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
    if (viewer) {
        viewer.destroy();
    }
})

</script>

<style lang="less" scoped>
#cesiumContainer {
    width: 100%;
    height: 100%;
}
</style>