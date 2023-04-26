<template>
  <main class="w-full h-full">
    <VrMain
      :isFullScreen="VrMainStatus.isFullScreen"
      :mode="VrMainStatus.mode"
      :whichVr="VrMainStatus.whichVr"
      :vrList="VrMainStatus.vrList"
      @postionUpdate="VrMainEventHander.postionUpdate($event)"
      @editUpdating="VrMainEventHander.editUpdating($event)"
      @markerSelect="VrMainEventHander.markerSelect($event)"
      @connect-position-update="VrMainEventHander.connectPositionUpdate($event)"
    />
  </main>
  <aside
    class="fixed flex top-0 w-full flex-row-reverse pointer-events-none z-30"
  >
    <VrMap
      class="pointer-events-auto"
      :mapSrc="VrMapStatus.src"
      :position="VrMapStatus.position"
      :show="VrMapStatus.show"
    />
  </aside>
  <footer class="fixed flex bottom-0 w-full h-9 z-30">
    <FooterContent
      :vr-list="FooterContentStatus.vrList"
      :vr-index="FooterContentStatus.vrIndex"
      :menu-cross-show="VrMainStatus.mode === Mode.Edit"
      :update-loading="FooterContentStatus.editUpdating"
      @edit-click="FooterEventHander.editClick"
      @mapShowClick="FooterEventHander.mapClick"
      @fullscreen-click="FooterEventHander.fullScreenClick"
      @menu-click="FooterEventHander.menuClick"
    />
  </footer>
</template>

<script setup lang="ts">
import VrMain from "../components/vrMain.vue";
import VrMap from "../components/vrMap.vue";
import FooterContent from "../components/footerContent.vue";
import type { RadarPosition } from "../types/Postion";
import { Mode } from "../types/VrRenderControler";
import type {
  ConnectPosition,
  VrDetail,
  VrHouseDetail,
  VrManifestJSON,
  VrMapDetail,
} from "../types/Manifestdto";
const VrMainEventHander = {
  postionUpdate(postion: RadarPosition) {
    vrTotal.position = postion;
  },
  editUpdating(e: boolean) {
    vrTotal.editLoading = e;
  },
  markerSelect(targetIdx: number) {
    vrTotal.index = targetIdx;
  },
  connectPositionUpdate(newList: ConnectPosition[]) {
    vrTotal.vrList[vrTotal.index].connect_position = newList;
  },
};
const FooterEventHander = {
  mapClick() {
    vrTotal.mapShow = !vrTotal.mapShow;
  },
  fullScreenClick() {
    vrTotal.fullScreen = !vrTotal.fullScreen;
  },
  editClick() {
    vrTotal.mode = vrTotal.mode === Mode.Edit ? Mode.View : Mode.Edit;
  },
  menuClick(index: number) {
    if (vrTotal.mode === Mode.View) vrTotal.index = index;
    else {
    }
  },
};

const REQID = 20181501603;
const vrTotal = reactive({
  vrList: [] as VrHouseDetail[],
  vrMap: {} as VrMapDetail,
  mapShow: true,
  index: 0 as number,
  position: { x: 0, y: 0, r: 0 } as { x: number; y: number; r: number },
  fullScreen: false,
  mode: Mode.View,
  editLoading: false,
});
const VrMainStatus = computed(() => {
  return {
    isFullScreen: vrTotal.fullScreen,
    mode: vrTotal.mode,
    whichVr: vrTotal.vrList[vrTotal.index],
    vrList: vrTotal.vrList,
  };
});
const VrMapStatus = computed(() => {
  return {
    src: vrTotal.vrMap.picture,
    position: vrTotal.position,
    show: vrTotal.mapShow,
  };
});
const FooterContentStatus = computed(() => ({
  editUpdating: vrTotal.editLoading,
  vrList: vrTotal.vrList,
  vrIndex: vrTotal.index,
}));
fetch(`https://mobile.51fubaba.cn:8443/dl-weapp/api/ershoufang/vr/get/${REQID}`)
  .then((res: Response) => res.json() as Promise<VrManifestJSON>)
  .then((parsedJson: VrManifestJSON) => {
    vrTotal.vrMap = parsedJson.data.find(
      (vr: VrDetail) => vr.name === "map"
    ) as VrMapDetail;

    vrTotal.vrList = parsedJson.data
      .filter((vr: VrDetail) => vr.name !== "map")
      .map((vr: VrDetail) => {
        vr.connect_position = JSON.parse(vr.connect_position as string);
        return vr;
      }) as unknown as VrHouseDetail[];
  });
</script>
