<template>
  <ul class="flex bg-gray-300/80 rounded-r-lg">
    <li
      tabindex="0"
      title="显示/关闭户型图"
      @click="
        emit('mapShowClick');
        btnStatus.mapShow = !btnStatus.mapShow;
      "
      class="flex w-9 h-9 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <!-- 地图按钮 -->
      <i
        class="w-8 h-8 cursor-pointer with-base-map"
        :class="{
          'with-show-map': !btnStatus.mapShow,
          'with-del-map': btnStatus.mapShow,
        }"
        id="map"
      >
        <svg
          stroke-linejoin="round"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
          <path d="M4 2.6 l17 18z" />
        </svg>
      </i>
    </li>
    <li
      title="编辑/保存"
      tabindex="0"
      @click="
        emit('editClick');
        btnStatus.penShow = !btnStatus.penShow;
      "
      class="flex w-9 h-9 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <!-- 编辑按钮 -->
      <i
        class="w-8 h-8 cursor-pointer with-base-edit"
        :class="{
          'with-show-check': !btnStatus.penShow,
          'with-show-pen': btnStatus.penShow,
        }"
        id="edit"
      >
        <svg
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            class="p-outline"
            d="M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
          />
          <path
            class="p-pen"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
          />
          <path class="p-check" color="#41b883" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </i>
    </li>
    <li
      tabindex="0"
      title="全屏模式"
      @click="emit('fullscreenClick')"
      class="flex w-9 h-9 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <MySvgIcon name="icon-fullscreen" class="w-8 h-8 cursor-pointer" />
    </li>
    <li
      tabindex="0"
      title="房间列表"
      class="flex w-9 h-9 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <!-- 所有房间 -->
      <MySvgIcon name="icon-menu" class="w-8 h-8 cursor-pointer" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import MySvgIcon from "~virtual/svg-component";
const emit = defineEmits<{
  (e: "mapShowClick"): void;
  (e: "editClick"): void;
  (e: "fullscreenClick"): void;
}>();
const btnStatus = reactive({
  mapShow: true,
  penShow: true,
});
</script>

<style scoped>
/* 
	* This code is used to make the last item in a list have rounded corners
	* on the bottom right and top right. 
*/
ul > li:last-child {
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}
.with-base-map > svg :last-child {
  transition: stroke-dashoffset 0.3s ease-in-out;
  stroke-dasharray: 50;
}
.with-del-map > svg :last-child {
  /* stroke-dashoffset表示删除线的位移,带着删除线时,删除线不位移 */
  stroke-dashoffset: 0;
}
.with-show-map > svg :last-child {
  /* stroke-dashoffset表示删除线的位移,不带着删除线时,删除位移50px,这将会移出视线,看起来像消失了一样 */
  stroke-dashoffset: 50;
}
.with-base-edit > svg > .p-pen {
  transition: opacity 0.3s ease;
}
.with-base-edit > svg > .p-check {
  transition: stroke-dashoffset 0.3s ease;
  stroke-dasharray: 25;
}
.with-show-pen > svg path.p-check {
  stroke-dashoffset: 25;
}
.with-show-pen > svg path.p-pen {
  opacity: 1;
}
.with-show-check > svg path.p-check {
  stroke-dashoffset: 0;
}
.with-show-check > svg path.p-pen {
  opacity: 0;
}
</style>
