import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import monkey, { cdn } from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: "src/main.ts",
      userscript: {
        icon: "https://vitejs.dev/logo.svg",
        namespace: "npm/vite-plugin-monkey",
        match: [
          "^https://www.zhipin.com/web/geek/job$",
          "^https://www.zhipin.com/web/geek/job?*"
        ],
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr("Vue", "dist/vue.global.prod.js"),
        },
      },
    }),
  ],
});
