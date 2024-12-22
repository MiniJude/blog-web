import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

const base = "/welcome-to-my-website";

// const cesiumSource = path.resolve(__dirname, "./node_modules/cesium/Build/Cesium");
const cesiumSource = "node_modules/cesium/Build/Cesium";

// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
const cesiumBaseUrl = "cesiumStatic";

// https://vitejs.dev/config/
export default defineConfig({
    base,
    define: {
        // Define relative base path in cesium for loading assets
        // https://vitejs.dev/config/shared-options.html#define
        CESIUM_BASE_URL: JSON.stringify(`${base}/${cesiumBaseUrl}`),
    },
    plugins: [
        vue(),
        viteStaticCopy({
            targets: [
                { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
                { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
            ],
        }),
    ],
    // 配置@
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
