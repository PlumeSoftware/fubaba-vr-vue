<template>
  <svg
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    class="base"
    :class="{ cross: props.crossShow }"
  >
    <path
      d="M3.75 6.75h16.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></path>
    <path
      d="M3.75 12h16.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></path>
    <path
      d="M3.75 17.25h16.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></path>
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  crossShow: boolean;
}>();
</script>

<style scoped>
.base,
.base path {
  transform-origin: center;
  transition: transform 0.3s ease;
  transform: none;
}
.cross {
  transform: rotate(90deg);
}
.cross path:first-child {
  transform: translate(-5.25px) rotate(90deg);
}
.cross path:nth-child(3) {
  transform: translate(-5.25px) rotate(-90deg);
}
</style>
