<script setup lang="ts">
import { Viewer, events } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css"; //necessary
import type { ConnectPosition, VrHouseDetail } from "../types/Manifestdto";
import { Mode } from "../types/VrRenderControler";
import type { Direction, RadarPosition } from "../types/Postion";
import {
  SelfMarkersPlugin,
  SelfMarkersPluginClick,
  SelfMarkersPluginTouchEnd,
  SelfMarkersPluginTouchMove,
} from "../utils/SelfMarkerPlugin";
import { watchImmediate } from "@vueuse/core";
import { aMidInB, aRelativeB } from "../utils/domUtils";

const emit = defineEmits<{
  (e: "postionUpdate", postion: RadarPosition): void;
  (e: "editUpdating", loading: boolean): void;
  (e: "markerSelect", targetIndex: number): void;
  (e: "connectPositionUpdate", hotPoints: ConnectPosition[]): void;
}>();
const props = defineProps<{
  isFullScreen: boolean;
  mode: Mode;
  whichVr: VrHouseDetail | null;
  vrList: VrHouseDetail[] | null;
}>();
const directionMap = {
  东: (90 / 180) * Math.PI,
  南: (180 / 180) * Math.PI,
  西: (270 / 180) * Math.PI,
  北: 0,
};
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
let viewer: Viewer | null = null;
let vrListCommitable = false;
onMounted(async () => {
  if (!vrContainer.value) return;
  viewer = await createVrViewer();
  initMarker();
  watchState();

  async function createVrViewer(): Promise<Viewer> {
    //promise 用于等待viewer初始化完成
    const viewer = new Viewer({
      container: vrContainer.value!,
      defaultZoomLvl: 0,
      navbar: false,
      size: {
        width: "100vw",
        height: "100vh",
      },
      //默认首页是数据中的第一项
      plugins: [[SelfMarkersPlugin, { canDrag: props.mode === Mode.Edit }]],
    });

    watchImmediate(
      () => props.whichVr,
      function reloadPanorame(newVr) {
        if (!newVr) return;
        viewer.setPanorama(
          `https://fmj.51fubaba.com:6443/picture/vr_picture/${newVr.picture}`
        );

        emit("postionUpdate", {
          x: newVr.xpoint,
          y: newVr.ypoint,
          r: directionMap[newVr.chaoxiang.trim() as Direction],
        });
      }
    );

    viewer.addEventListener(
      "position-updated",
      (e: events.PositionUpdatedEvent) => {
        //发出事件让父组件接收,然后父组件再发出事件给子组件,子组件再渲染地图
        if (!props.whichVr) return;
        emit("postionUpdate", {
          x: props.whichVr.xpoint,
          y: props.whichVr.ypoint,
          r:
            directionMap[props.whichVr.chaoxiang.trim() as Direction] +
            e.position.yaw, //yaw的单位是弧度
        });
      }
    );

    return new Promise((resolve) => {
      viewer!.addEventListener(
        "ready",
        () => {
          resolve(viewer);
        },
        { once: true }
      );
    });
  }
  function initMarker() {
    const myPlugin = viewer!.getPlugin<SelfMarkersPlugin>(SelfMarkersPlugin);
    if (!myPlugin || !props.whichVr) return;
    const onMarkerClick = (e: SelfMarkersPluginClick) => {
      if (props.mode === Mode.Edit) return;
      viewer!.stopAnimation();
      emit("markerSelect", e.metaData as number);
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
        if (!aMidInB(e.marker, trashState.container!))
          return void (trashState.direction = "none");
        trashState.direction = aRelativeB(e.marker, trashState.container!);
      }
    );
    myPlugin.addEventListener(
      "markerTouchEnd",
      (e: SelfMarkersPluginTouchEnd) => {
        //判断是否删除
        if (!props.whichVr) return;
        if (aMidInB(e.marker, trashState.container!)) {
          //如果在垃圾桶里面,就删除
          myPlugin.removeMarker(e.marker, {
            animate: true,
            animateName: "marker-out", //动画写在css里,也可以自己写动画
            onAnimateEnd: () => {
              //删除后,把垃圾桶隐藏
              if (!props.whichVr) return;
              trashState.show = false;
              trashState.direction = "none";
              //删除后,把数据中的这个房源删除
              const comitList = Array.from(props.whichVr.connect_position);
              const delIdx = comitList.findIndex(
                (cp) => cp.target === props.vrList![<number>e.metaData].vr_id
              );
              if (delIdx === -1) return;
              comitList.splice(delIdx, 1);
              emit("connectPositionUpdate", comitList);
            },
          });
        } else {
          //如果不在垃圾桶里面,就不删除,只隐藏垃圾桶
          trashState.show = false;
          trashState.direction = "none";

          const comitList = Array.from(props.whichVr.connect_position);
          const targetIdx = comitList.findIndex(
            (cp) => cp.target === props.vrList![<number>e.metaData].vr_id
          );
          if (targetIdx === -1) return;
          comitList[targetIdx].pitch = e.position.pitch;
          comitList[targetIdx].yaw = e.position.yaw;
          emit("connectPositionUpdate", comitList);
        }
        //只要拖拽了marker,就认为marker的信息有所改变
        vrListCommitable = true;
      }
    );
    watchImmediate(
      () => props.whichVr,
      function reloadMarker(newVr) {
        if (!newVr) return;
        myPlugin.removeAllMarker();
        newVr.connect_position.forEach((position) => {
          const targetIdx = props.vrList!.findIndex(
            (vr) => vr.vr_id === position.target
          );
          if (position.autoGen) {
            const res = myPlugin.__computeMarkerPosition(
              window.innerWidth / 2,
              window.innerHeight / 2
            );
            position.yaw = res.yaw;
            position.pitch = res.pitch;
          }
          myPlugin.addMarker(
            `<a tabindex="0" class="flex flex-col items-center text-white cursor-pointer pointer-events-auto"><img class="w-8" src="/advance.svg"/><p>${
              props.vrList![targetIdx].name || "未命名"
            }</p></a>`,
            { position, metaData: targetIdx }
          );
        });
      }
    );
  }
  function watchState() {
    watch(
      () => props.isFullScreen,
      () => {
        viewer?.enterFullscreen();
      }
    );
    watch(
      () => props.mode,
      (newMode: Mode) => {
        if (!viewer) return;
        viewer
          .getPlugin<SelfMarkersPlugin>(SelfMarkersPlugin)
          ?.setCanDrag(newMode === Mode.Edit);
        if (newMode === Mode.View && vrListCommitable) {
          commitConnectPosition();
        }
      }
    );
  }
  function commitConnectPosition() {
    if (!props.whichVr) return;
    const formData = new URLSearchParams();
    formData.append("vr_id", props.whichVr.vr_id.toString());
    formData.append(
      "connect_position",
      JSON.stringify(props.whichVr.connect_position)
    );

    emit("editUpdating", true);
    return fetch("https://mobile.51fubaba.cn:8443/dl-weapp/api/vr/update", {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: formData,
    }).then((res) => {
      vrListCommitable = false;
      emit("editUpdating", false);
      return res;
    });
  }
});
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
