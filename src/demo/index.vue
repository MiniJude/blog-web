<template>
    <div class="demo-list">
        <div class="card" v-for="demo in demos" :key="demo.name" @click="navigateTo(demo.path)">
            <div class="card-image">
                <img :src="demo.image" alt="Demo Image" />
            </div>
            <div class="card-content">
                <h3>{{ demo.name }}</h3>
                <p>{{ demo.description }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import demoCanvasCoverImg from '@/assets/demo-canvas.png';
import demoCesiumCoverImg from '@/assets/demo-cesium.png';
import jsPdfCoverImg from '@/assets/demo-jspdf.png';

// 路由实例
const router = useRouter();

// demo 数据
const demos = [
    {
        name: 'Canvas Demo',
        path: '/demo/canvas',
        image: demoCanvasCoverImg,
        description: 'A demo showcasing canvas functionalities.',
    },
    {
        name: 'Cesium Demo',
        path: '/demo/cesium',
        image: demoCesiumCoverImg,
        description: 'Explore 3D map features using Cesium.',
    },
    {
        name: 'jsPDF Demo',
        path: '/demo/jspdf',
        image: jsPdfCoverImg,
        description: 'Create PDFs dynamically using jsPDF.',
    },
];

// 跳转路由
const navigateTo = (path: string) => {
    router.push(path);
};
</script>

<style lang="less" scoped>
.demo-list {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    padding: 20px;
}

.card {
    background-color: #fff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
}

.card-image img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.card-content {
    padding: 15px;
}

.card-content h3 {
    font-size: 18px;
    margin: 0 0 10px;
}

.card-content p {
    font-size: 14px;
    color: #666;
}
</style>