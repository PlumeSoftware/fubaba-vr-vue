<script setup lang="ts">
import { Viewer, events } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css"; //necessary
import type {
  VrDetail,
  VrHouseDetail,
  VrManifestJSON,
  VrMapDetail,
} from "../types/Manifestdto";
import { Mode, type VrRenderControler } from "../types/VrRenderControler";
import type { Direction, RadarPosition } from "../types/Postion";
import {
  SelfMarkersPlugin,
  SelfMarkersPluginClick,
  SelfMarkersPluginTouchEnd,
  SelfMarkersPluginTouchMove,
} from "../utils/SelfMarkerPlugin";

const emit = defineEmits<{
  (e: "postionUpdate", postion: RadarPosition): void;
  (e: "mapGot", src: string): void;
  (e: "updateLoading", loading: boolean): void;
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
const trashState = reactive<{
  container: HTMLElement | null;
  show: boolean;
  direction: "none" | "left" | "right";
}>({
  container: null,
  show: false,
  direction: "none",
});
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
      this._nowAt = 0;
      this._vrListCommitable = false;
      watch(
        () => props.isFullScreen,
        () => {
          this.viewer?.enterFullscreen();
        }
      );
      watch(
        () => props.mode,
        (newMode: Mode) => {
          if (!this.viewer) return;
          this.viewer
            .getPlugin<SelfMarkersPlugin>(SelfMarkersPlugin)
            ?.setCanDrag(newMode === Mode.Edit);
          if (newMode === Mode.View && this._vrListCommitable) {
            this._updateConnectPosition();
          }
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
      //promise 用于等待viewer初始化完成
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
        plugins: [[SelfMarkersPlugin, { canDrag: props.mode === Mode.Edit }]],
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
                this.vrList[this.nowAt].chaoxiang.trim() as Direction
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
      const myPlugin =
        this.viewer?.getPlugin<SelfMarkersPlugin>(SelfMarkersPlugin);
      if (!myPlugin || !this.vrList) return;
      const onMarkerClick = (e: SelfMarkersPluginClick) => {
        if (props.mode === Mode.Edit) return;
        this.viewer?.stopAnimation();
        this.nowAt = e.metaData as number;
      };
      myPlugin.addEventListener("markerClick", onMarkerClick);
      myPlugin.addEventListener("markerTouchStart", () => {
        //显示垃圾桶
        trashState.show = true;
      });
      myPlugin.addEventListener(
        "markerTouchMove",
        (e: SelfMarkersPluginTouchMove) => {
          //判断垃圾桶的方向
          if (!this._aMidInB(e.marker, trashState.container!))
            return void (trashState.direction = "none");
          trashState.direction = this._aRelativeB(
            e.marker,
            trashState.container!
          );
        }
      );
      myPlugin.addEventListener(
        "markerTouchEnd",
        (e: SelfMarkersPluginTouchEnd) => {
          //判断是否删除
          if (this._aMidInB(e.marker, trashState.container!)) {
            //如果在垃圾桶里面,就删除
            myPlugin.removeMarker(e.marker, {
              animate: true,
              animateName: "marker-out", //这个动画写在下面,也可以自己写动画
              onAnimateEnd: () => {
                //删除后,把垃圾桶隐藏
                trashState.show = false;
                trashState.direction = "none";
                //删除后,把数据中的这个房源删除
                const delIndex = this.vrList![
                  this._nowAt
                ].connect_position.findIndex(
                  (connet) =>
                    connet.target === this.vrList![<number>e.metaData].vr_id
                );
                this.vrList![this._nowAt].connect_position.splice(delIndex, 1);
              },
            });
          } else {
            //如果不在垃圾桶里面,就不删除,只隐藏垃圾桶
            trashState.show = false;
            trashState.direction = "none";

            const targetIdx = this.vrList![
              this._nowAt
            ].connect_position.findIndex(
              (hotPoint) =>
                this.vrList![<number>e.metaData].vr_id === hotPoint.target
            );
            if (targetIdx === -1) return;
            this.vrList![this._nowAt].connect_position[targetIdx].pitch =
              e.position.pitch;
            this.vrList![this._nowAt].connect_position[targetIdx].yaw =
              e.position.yaw;
          }
          //只要拖拽了marker,就认为marker的信息有所改变
          this._vrListCommitable = true;
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
        r: directionMap[this.vrList[0].chaoxiang.trim() as Direction],
      });
      return;
    }
    private _loadMarkers() {
      if (!this.viewer) return;
      if (!this.vrList) return;
      const myPlugin =
        this.viewer?.getPlugin<SelfMarkersPlugin>(SelfMarkersPlugin);
      if (!myPlugin) return;
      this.vrList[this.nowAt].connect_position.forEach((position) => {
        const targetIdx = this.vrList!.findIndex(
          (el: VrHouseDetail) => el.vr_id === position.target
        );
        myPlugin.addMarker(
          `<a tabindex="0" class="flex flex-col items-center text-white cursor-pointer pointer-events-auto"><img class="w-8" src="/advance.svg"/><p>${
            this.vrList![targetIdx].name || "未命名"
          }</p></a>`,
          { position, metaData: targetIdx }
        );
      });
    }
    private _updateConnectPosition() {
      const formData = new URLSearchParams();
      formData.append("vr_id", this.vrList![this.nowAt].vr_id.toString());
      formData.append(
        "connect_position",
        JSON.stringify(this.vrList![this.nowAt].connect_position)
      );
      emit("updateLoading", true);
      return fetch("https://mobile.51fubaba.cn:8443/dl-weapp/api/vr/update", {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        method: "POST",
        body: formData,
      }).then((res) => {
        this._vrListCommitable = false;
        emit("updateLoading", false);
        return res;
      });
    }
    _aMidInB(a: HTMLElement, b: HTMLElement): boolean {
      //判断a的中心是否在b中
      const aPos = a.getBoundingClientRect();
      const bPos = b.getBoundingClientRect();
      const aMiddleX = aPos.left + aPos.width / 2;
      const aMiddleY = aPos.top + aPos.height / 2;
      if (
        aMiddleX >= bPos.left &&
        aMiddleX <= bPos.left + bPos.width &&
        aMiddleY >= bPos.top &&
        aMiddleY <= bPos.top + bPos.height
      )
        return true;
      return false;
    }
    _aRelativeB(a: HTMLElement, b: HTMLElement): "right" | "left" {
      //判断a相对于b的位置
      const aPos = a.getBoundingClientRect();
      const bPos = b.getBoundingClientRect();
      const aMiddleX = aPos.left + aPos.width / 2;
      const bMiddleX = bPos.left + bPos.width / 2;
      if (aMiddleX <= bMiddleX) return "left";
      return "right";
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
      const myPlugin =
        this.viewer.getPlugin<SelfMarkersPlugin>(SelfMarkersPlugin);
      myPlugin.removeAllMarker();

      this._nowAt = idx;

      this._loadMarkers();

      emit("postionUpdate", {
        x: this.vrList[idx].xpoint,
        y: this.vrList[idx].ypoint,
        r: directionMap[this.vrList[idx].chaoxiang.trim() as Direction],
      });
    }
    vrList?: VrHouseDetail[];
    _vrListCommitable: boolean; //是否允许提交更改,主要是为了减少多次上传相同的位置
    vrMap?: VrMapDetail;
    viewer?: Viewer;
    private _nowAt: number;
  };
}
</script>

<template>
  <div ref="vrContainer" />
  <!-- 垃圾桶图标 -->
  <Transition name="slide-fade">
    <footer
      :ref="(el:HTMLElement) => void (trashState.container = el)"
      v-show="trashState.show"
      class="flex fixed right-0 md:left-1/2 md:-translate-x-1/2 bottom-0 h-20 w-20 items-top justify-center"
    >
      <i
        class="w-20 h-16 mt-2 translate-y-1/2 bg-gray-300/80 shadow-md shadow-gray-300/80 rounded-l-lg md:rounded-xl"
      >
        <TrashIcon
          class="w-10 h-10 m-auto"
          :direaticon="trashState.direction"
        />
      </i>
    </footer>
  </Transition>
</template>

<style scoped>
:deep(.psv-markers) {
  pointer-events: none;
}
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(1rem);
  opacity: 0;
}
:deep(.marker-out) {
  /* marker的删除动画 */
  transition: transform 0.3s ease-out;
  transform: scale(0);
}
</style>
