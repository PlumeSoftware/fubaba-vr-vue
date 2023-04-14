<script setup lang="ts">
import Preview from "./pages/preview.vue";
const msg = ref("");
onErrorCaptured((err: unknown) => {
  if (err instanceof Error) {
    if (err.message.toLocaleLowerCase().includes("net")) {
      msg.value = "网络错误";
      return false;
    }
    msg.value = "未知错误";
  }
  return false;
});
</script>

<template>
  <div v-show="msg === ''">
    <Preview />
    <main
      v-if="msg !== ''"
      class="flex h-screen w-screen flex-col justify-center items-center bg-slate-300"
    >
      <b class="text-red-500 text-2xl">{{ msg }}</b>
      <p class="m-4">如果之前已经加载了部分数据,还想继续查看请点击下面的按钮</p>
      <button
        class="bg-slate-900 m-4 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 text-sm text-white font-semibold h-12 px-6 rounded-lg flex items-center"
        @click="msg = ''"
      >
        还原
      </button>
    </main>
  </div>
</template>

<style scoped>
:root {
  background-color: grey;
}
</style>
