<script setup lang="ts">
import type { RadarPosition } from "../types/Postion";

const props = defineProps<{
  mapSrc?: string;
  show: boolean;
  position: RadarPosition;
}>();
const mapHost = ref<HTMLElement>();
const pointerHost = ref<HTMLElement>();

const pointerSize = reactive({ width: 0, top: 0, left: 0, rotate: 0 });
const pointerSizeStyle = computed(() => {
  return {
    width: pointerSize.width + "px",
    top: pointerSize.top + "px",
    left: pointerSize.left + "px",
    transform: `rotate(${pointerSize.rotate}rad)`,
  };
}); //让css能识别对象
const mapZoomCss = reactive({
  zoomStatus: "normal" as "normal" | "zoom",
  normal: {
    transform: "none",
    cursor: "zoom-in",
    opacity: 0.7,
  },
  zoom: {
    /* 坑：
    transform: "translate(calc(50% - 50vw), calc(-50% + 50vh)) scale(2)"
    !=transform: "scale(2) translate(calc(50% - 50vw), calc(-50% + 50vh))"
    先写scale表示先放缩再位移,
    后写scale和表示先位移再放缩
    两者的区别在于50%和50vw的参照数会对不齐,然后元素就不居中了
    */
    transform:
      "translate(calc(50% - 50vw), calc(-50% + 50vh)) " +
      (document.body.clientWidth > 640 ? "scale(1.7)" : "scale(2.8)"),
    cursor: "zoom-out",
    opacity: 1,
  },
});

const mapPositionObserver = new ResizeObserver(pointerAutoMove); //当屏幕形态改变时,自动调整指针位置
watch(
  () => props.position,
  (newPosition) => {
    poinerRotate(newPosition.r);
    if (mapZoomCss.zoomStatus === "zoom") return;
    pointerAutoMove();
  }
); //当组件的props改变时,调整指针位置
onMounted(() => {
  if (!mapHost.value || !pointerHost.value) return;
  //添加监听器
  mapPositionObserver.observe(mapHost.value);
});
function onMapHostClick() {
  if (mapZoomCss.zoomStatus === "normal") {
    mapPositionObserver.unobserve(mapHost.value!);
    mapZoomCss.zoomStatus = "zoom";
  } else {
    mapZoomCss.zoomStatus = "normal";
    //因为有动画,所以要等动画结束再重新监听mapHost的大小变化
    //否则会出现指针位置不对的bug
    setTimeout(() => {
      mapPositionObserver.observe(mapHost.value!);
      //这里的350是动画时间的2倍+50ms
    }, 350);
  }
}
function pointerMoveTo(left: number, top: number) {
  pointerSize.left = left;
  pointerSize.top = top;
}
function poinerRotate(slideTo: number) {
  pointerSize.rotate = slideTo;
}
function pointerAutoMove() {
  // 指针的大小由mapHost的宽度决定,这样可以保证指针的相对大小不会变化
  if (!mapHost.value || !pointerHost.value) return;
  const hostRect = mapHost.value.getBoundingClientRect();
  const pointerRect = pointerHost.value.getBoundingClientRect();
  //指针是个正方形,边长为map图片的1/9
  pointerSize.width = hostRect.width / 9;
  if (pointerSize.width > 28) pointerSize.width = 28;
  if (pointerSize.width < 12) {
    //指针的大小小于12px时,误差会很大,所以就不用修正了
    pointerMoveTo(
      (props.position.x / 100000) * hostRect.width,
      (props.position.y / 100000) * hostRect.height
    );
  } else {
    //指针的位置由props.position决定
    pointerMoveTo(
      (props.position.x / 100000) * hostRect.width - pointerRect.width / 2,
      (props.position.y / 100000) * hostRect.height - pointerRect.height / 2
    );
  }
}
</script>

<template>
  <Transition>
    <div
      tabindex="1"
      ref="mapHost"
      v-show="props.mapSrc && props.show"
      class="w-1/4 relative transition-transform cursor-zoom-in"
      :style="mapZoomCss[mapZoomCss.zoomStatus]"
      @click="onMapHostClick"
    >
      <img
        :src="
          props.mapSrc
            ? `https://fmj.51fubaba.com:6443/picture/vr_picture/${props.mapSrc}`
            : void 0
        "
        alt="户型图"
        title="户型图"
      />
      <i class="opacity-70 max-w-md" ref="pointerHost">
        <img
          class="absolute"
          :style="pointerSizeStyle"
          src="../assets/pointer.svg"
          alt="I"
          title="您的位置"
        />
      </i>
    </div>
  </Transition>
</template>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease !important;
}

.v-enter-from,
.v-leave-to {
  opacity: 0 !important;
}
</style>
