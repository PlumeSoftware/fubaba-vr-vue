<script setup lang="ts">
import { Viewer, events } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css"; //necessary
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css"; //necessary
import type {
  VrDetail,
  VrHouseDetail,
  VrManifestJSON,
  VrMapDetail,
} from "../types/Manifestdto";
import { Mode, type VrRenderControler } from "../types/VrRenderControler";
import type { RadarPosition } from "../types/Postion";
import { useDraggable } from "@vueuse/core";

const emit = defineEmits<{
  (e: "postionUpdate", postion: RadarPosition): void;
  (e: "mapGot", src: string): void;
}>();
const props = defineProps<{
  isFullScreen: boolean;
  mode: Mode;
}>();
const directionMap = {
  东: (90 / 180) * Math.PI,
  南: (180 / 180) * Math.PI,
  西: (270 / 180) * Math.PI,
  北: 0,
};

const REQID = 20181501603;
const vrContainer = ref<HTMLElement>();
const vrManifestJsonPromise = fetch(
  `https://mobile.51fubaba.cn:8443/dl-weapp/api/ershoufang/vr/get/${REQID}/`
).then((res: Response) => res.json() as Promise<VrManifestJSON>);

const vrControler: VrRenderControler = new (ControlerFactory(
  vrManifestJsonPromise
))();
onMounted(async () => {
  if (!vrContainer.value) return;
  await vrControler.initVrList();
  vrControler.renderMap();
  await vrControler.initVrViewer();
  vrControler.initMarker();
});
function ControlerFactory(vrManifestJsonPromise: Promise<VrManifestJSON>) {
  return class RenderControler implements VrRenderControler {
    constructor() {
      this.mode = Mode.View;
      this._nowAt = 0;
      watch(
        () => props.isFullScreen,
        () => {
          this.viewer?.enterFullscreen();
        }
      );
    }

    initVrList() {
      //获取vr列表
      return vrManifestJsonPromise.then((parsedJson: VrManifestJSON) => {
        this.vrMap = parsedJson.data.find(
          (vr: VrDetail) => vr.name === "map"
        ) as VrMapDetail;

        this.vrList = parsedJson.data
          .filter((vr: VrDetail) => vr.name !== "map")
          .map((vr: VrDetail) => {
            vr.connect_position = JSON.parse(vr.connect_position as string);
            return vr;
          }) as unknown as VrHouseDetail[];
      });
    }
    async initVrViewer(): Promise<void> {
      if (!vrContainer.value) return;
      if (!this.vrList) return;
      //因为这个库的问题,会请求两次图片,这里先帮他请求好,缓存起来
      const imgPromise = fetch(
        `https://fmj.51fubaba.com:6443/picture/vr_picture/${this.vrList[0].picture}`
      ).then((res: Response) => res.blob());
      this.viewer = new Viewer({
        container: vrContainer.value,
        defaultZoomLvl: 0,
        navbar: false,
        size: {
          width: "100vw",
          height: "100vh",
        },
        //默认首页是数据中的第一项
        panorama: URL.createObjectURL(await imgPromise),
        plugins: [[MarkersPlugin, []]],
      });

      this.viewer.addEventListener(
        "position-updated",
        (e: events.PositionUpdatedEvent) => {
          //发出事件让父组件接收,然后父组件再发出事件给子组件,子组件再渲染地图
          if (!this.vrList) return;
          emit("postionUpdate", {
            x: this.vrList[this.nowAt].xpoint,
            y: this.vrList[this.nowAt].ypoint,
            r:
              directionMap[
                this.vrList[this.nowAt].chaoxiang.trim() as
                  | "东"
                  | "南"
                  | "西"
                  | "北"
              ] + e.position.yaw, //yaw的单位是弧度
          });
        }
      );
      return new Promise((resolve) => {
        this.viewer?.addEventListener("ready", () => {
          resolve();
        });
      });
    }
    initMarker() {
      console.log();

      const markersPlugin =
        this.viewer?.getPlugin<MarkersPlugin>(MarkersPlugin);
      if (!markersPlugin || !this.vrList) return;
      markersPlugin.addEventListener(
        "select-marker",
        ({ marker, rightClick }) => {
          console.log(marker);

          if (rightClick) return;
          this.nowAt = marker.data as number;
        }
      );
      this._loadMarkers();
    }
    renderMap(): void {
      if (!this.vrMap) return;
      if (!this.vrList) return;
      //发出事件让父组件接收,然后父组件再发出事件给子组件,子组件再渲染地图
      emit("mapGot", this.vrMap.picture);
      //默认首页是数据中的第一项

      emit("postionUpdate", {
        x: this.vrList[0].xpoint,
        y: this.vrList[0].ypoint,
        r: directionMap[
          this.vrList[0].chaoxiang.trim() as "东" | "南" | "西" | "北"
        ],
      });
      return;
    }
    private _loadMarkers() {
      if (!this.viewer) return;
      if (!this.vrList) return;
      const markersPlugin =
        this.viewer?.getPlugin<MarkersPlugin>(MarkersPlugin);
      if (!markersPlugin) return;

      this.vrList[this.nowAt].connect_position.forEach((position) => {
        const targetIdx = this.vrList!.findIndex(
          (el: VrHouseDetail) => el.vr_id === position.target
        );
        markersPlugin.addMarker({
          id: "" + position.target,
          html: `<a tabindex="0" class="flex flex-col items-center text-white cursor-pointer pointer-events-auto"><img class="w-8" src="/advance.svg"/><p>${
            this.vrList![targetIdx].name || "未命名"
          }</p></a>`,
          position: position,
          data: targetIdx,
        });
        // const targetDOM = markersPlugin.getMarker(
        //   "" + position.target
        // ).domElement;
        // targetDOM.style.position = "fixed";
        // useDraggable(targetDOM);
      });
    }
    get nowAt(): number {
      return this._nowAt;
    }
    set nowAt(idx: number) {
      if (!this.vrList) return;
      if (!this.viewer) return;

      this.viewer.setPanorama(
        `https://fmj.51fubaba.com:6443/picture/vr_picture/${this.vrList[idx].picture}`
      );
      const markersPlugin = this.viewer.getPlugin<MarkersPlugin>(MarkersPlugin);
      markersPlugin.removeMarkers(
        this.vrList[this._nowAt].connect_position.map((el) => "" + el.target)
      );

      this._nowAt = idx;

      this._loadMarkers();

      emit("postionUpdate", {
        x: this.vrList[idx].xpoint,
        y: this.vrList[idx].ypoint,
        r: directionMap[
          this.vrList[idx].chaoxiang.trim() as "东" | "南" | "西" | "北"
        ],
      });
    }
    vrList?: VrHouseDetail[];
    vrMap?: VrMapDetail;
    viewer?: Viewer;
    private _nowAt: number;
    mode: Mode;
  };
}
</script>

<template>
  <div ref="vrContainer" />
</template>

<style scoped>
:deep(.psv-markers) {
  pointer-events: none;
}
</style>
