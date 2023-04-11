import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { cdn } from "vite-plugin-cdn2";
//AutoImport
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import UnpluginSvgComponent from "unplugin-svg-component/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: path.resolve(__dirname, "typing-autogen/components.d.ts"),
      extensions: ["vue"],
      dirs: ["./src/components/"],
      version: 3,
    }),
    AutoImport({
      imports: ["vue"],
      dirs: ["./src/components/"],
      vueTemplate: true,
      dts: path.resolve(__dirname, "typing-autogen/auto-imports.d.ts"),
    }),
    UnpluginSvgComponent({
      iconDir: path.resolve(__dirname, "src/assets"),
      dts: true,
      preserveColor: path.resolve(__dirname, "icons/common"),
      dtsDir: path.resolve(__dirname, "typing-autogen"),
      svgSpriteDomId: "my-svg-id",
      prefix: "icon",
      componentName: "MySvgIcon",
      symbolIdFormatter: (svgName: string, prefix: string): string => {
        const nameArr = svgName.split("/");
        if (prefix) nameArr.unshift(prefix);
        return nameArr.join("-").replace(/\.svg$/, "");
      },
      componentStyle: "",
      optimizeOptions: undefined,
      vueVersion: 3,
      projectType: "vue",
      scanStrategy: "component",
    }),
    cdn({ isProduction: false, modules: [{ name: "vue", global: "Vue" }] }),
  ],
});
