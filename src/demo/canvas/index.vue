<template>
  <div>
    <canvas ref="canvasRef"></canvas>
    <!-- <button @click="addImage">添加图片</button> -->
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import Cvs from './Cvs';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let cvs: Cvs | null = null;

onMounted(() => {
  if (canvasRef.value) {
    cvs = new Cvs(canvasRef.value);
    addImage()
  }
});

const addImage = (): void => {
  const imgSrc = new URL('../../assets/chair.png', import.meta.url).toString();
  if (cvs) {
    cvs.addImage(imgSrc);
  }
};
</script>

<style scoped>
canvas {
  background-color: #fff;
}
</style>