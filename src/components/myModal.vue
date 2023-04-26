<template>
  <Teleport to="body">
    <Transition name="modal-mask" @before-enter="transitionSetup">
      <div
        v-if="props.show"
        @click.self="emit('close')"
        class="fixed flex justify-center items-center top-0 z-40 w-full h-full bg-black/30 -my-modal"
      >
        <div class="absolute modal-content">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["close"]);
const brustCoordinate = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let editAble = true;
watch(
  () => props.show,
  (show) => {
    if (show) editAble = true;
  }
);
function transitionSetup(el: HTMLElement) {
  el.style.setProperty("--my-modal-x", brustCoordinate.x + "px");
  el.style.setProperty("--my-modal-y", brustCoordinate.y + "px");
}
document.body.addEventListener("pointerup", (e) => {
  if (!editAble) return;
  editAble = false;
  brustCoordinate.x = e.x - window.innerWidth / 2;
  brustCoordinate.y = e.y - window.innerHeight / 2;
});
</script>
<style scoped>
.modal-mask-enter-active,
.modal-mask-leave-active {
  transition: opacity 0.3s ease;
}
.modal-mask-enter-active .modal-content,
.modal-mask-leave-active .modal-content {
  transition: all 0.3s ease;
}
.modal-mask-enter-from,
.modal-mask-leave-to {
  opacity: 0;
}
.modal-mask-enter-from .modal-content,
.modal-mask-leave-to .modal-content {
  transform: translate(var(--my-modal-x), var(--my-modal-y)) scale(0.3);
  opacity: 0;
}
</style>
