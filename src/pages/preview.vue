<template>
  <!-- pages的文件负责中转事件、定义网页布局,从业务上来看无实际功能 -->
  <!-- pages之于components,正如框架之于业务实现 -->
  <main class="w-full h-full">
    <VrMain
      :isFullScreen="VrMainStatus.isFullScreen"
      :mode="VrMainStatus.mode"
      @mapGot="VrMainEventHander.mapGot($event)"
      @postionUpdate="VrMainEventHander.postionUpdate($event)"
    />
  </main>
  <!-- VrMap的高度没有由外层元素控制,而是由其图片的高度定义,因为pages只负责布局,而无实际功能 -->
  <aside
    class="fixed flex top-0 w-full flex-row-reverse pointer-events-none z-30"
  >
    <VrMap
      class="pointer-events-auto"
      :src="VrMapStatus.src"
      :position="VrMapStatus.position"
      :show="VrMapStatus.show"
    />
  </aside>
  <footer class="fixed flex bottom-0 w-full h-9">
    <FooterContent
      @edit-click="FooterEventHander.editClick"
      @mapShowClick="FooterEventHander.mapClick"
      @fullscreen-click="FooterEventHander.fullScreenClick"
    />
  </footer>
</template>

<script setup lang="ts">
import VrMain from "../components/vrMain.vue";
import VrMap from "../components/vrMap.vue";
import FooterContent from "../components/footerContent.vue";
import type { RadarPosition } from "../types/Postion";
import { Mode } from "../types/VrRenderControler";
const VrMainStatus = reactive({
  isFullScreen: false,
  mode: Mode.View,
});

const VrMapStatus = reactive<{
  src?: string;
  position: { x: number; y: number; r: number };
  show: boolean;
}>({
  src: void 0,
  position: { x: 0, y: 0, r: 0 },
  show: false,
});

const VrMainEventHander = {
  mapGot(src: string) {
    VrMapStatus.src = src;
    VrMapStatus.show = true;
  },
  postionUpdate(postion: RadarPosition) {
    VrMapStatus.position = postion;
  },
};

const FooterEventHander = {
  mapClick() {
    VrMapStatus.show = !VrMapStatus.show;
  },
  fullScreenClick() {
    VrMainStatus.isFullScreen = !VrMainStatus.isFullScreen;
  },
  editClick() {
    VrMainStatus.mode = VrMainStatus.mode === Mode.Edit ? Mode.View : Mode.Edit;
  },
};
</script>
