<template>
  <ul class="flex">
    <li
      tabindex="0"
      @click="
        emit('mapShowClick');
        btnStatus.mapShow = !btnStatus.mapShow;
      "
      class="flex w-9 h-9 bg-gray-300/80 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <!-- 地图按钮 -->
      <i
        class="w-8 h-8 block cursor-pointer with-base"
        :class="{
          'with-show': !btnStatus.mapShow,
          'with-del': btnStatus.mapShow,
        }"
        id="map"
        title="显示/关闭户型图"
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
      tabindex="0"
      class="flex w-9 h-9 bg-gray-300/80 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <!-- 编辑按钮 -->
      <i class="w-8 h-8 block cursor-pointer">
        <img src="../assets/edit.svg" alt="编辑" title="编辑/保存" />
      </i>
    </li>
    <li
      tabindex="0"
      title="全屏模式"
      @click="emit('fullscreenClick')"
      class="flex w-9 h-9 bg-gray-300/80 hover:bg-gray-400/80 transition-colors items-center justify-center"
    >
      <MySvgIcon name="icon-fullscreen" class="w-8 h-8 cursor-pointer" />
    </li>
    <li
      tabindex="0"
      title="房间列表"
      class="flex w-9 h-9 bg-gray-300/80 hover:bg-gray-400/80 transition-colors items-center justify-center"
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
.with-base > svg :last-child {
  transition: stroke-dashoffset 0.3s ease-in-out;
  stroke-dasharray: 50;
}
.with-del > svg :last-child {
  /* stroke-dashoffset表示删除线的位移,带着删除线时,删除线不位移 */
  stroke-dashoffset: 0;
}
.with-show > svg :last-child {
  /* stroke-dashoffset表示删除线的位移,不带着删除线时,删除位移50px,这将会移出视线,看起来像消失了一样 */
  stroke-dashoffset: 50;
}
</style>
