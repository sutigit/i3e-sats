import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import preact from "@preact/preset-vite";

const cesiumSource = "node_modules/cesium/Build/Cesium";
const cesiumBaseUrl = "cesiumStatic";

// https://vite.dev/config/
export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
  },
  plugins: [
    preact(),
    viteStaticCopy({
      targets: [
        { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
        { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
      ],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 4000, // cesium chunks are big
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            {
              name: "cesium",
              test: /node_modules[\\/]cesium/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
