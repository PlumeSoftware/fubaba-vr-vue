<template>
  <svg
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    :class="{ 'stroke-red-500': props.direaticon !== 'none' }"
  >
    <!-- 垃圾桶盖 -->
    <path
      d="M19.6 5a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      stroke-linecap="round"
      stroke-linejoin="round"
      :class="{
        'left-open': props.direaticon === 'left',
        'right-open': props.direaticon === 'right',
      }"
    ></path>
    <!-- 垃圾桶 -->
    <path
      d="m14.74,9.125l-0.346,9m-4.788,0l-0.346,-9m-9.21917,-9.14745m19.10266,5.89745l-0.98349,13.923a2.25,2.25 0 0 1 -2.244,2.077l-7.832,0a2.25,2.25 0 0 1 -2.244,-2.077l-1.068,-13.883"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  direaticon: "left" | "right" | "none";
}>();
</script>

<style scoped>
svg > path {
  transition: all 0.2s ease;
}
svg > .left-open {
  /* 垃圾桶盖左开口 */
  transform-origin: calc(99%) bottom;
  rotate: 9deg;
  translate: -7% 3%;
}
svg > .right-open {
  /* 垃圾桶盖右开口 */
  transform-origin: left bottom;
  rotate: -9deg;
  translate: 7% 3%;
}
</style>
