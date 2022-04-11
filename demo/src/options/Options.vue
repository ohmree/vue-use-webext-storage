<template>
  <main class="px-4 py-10 text-center text-gray-700 dark:text-gray-200">
    <pixelarticons-sliders class="icon-btn mx-2 text-2xl" />
    <div>Options</div>
    <p class="mt-2 opacity-50">
      This is the options page
    </p>

    <div class="mt-2">
      <input v-model="inputValue" class="border border-gray-400 rounded px-2 py-1 mr-1" />
      <button class="btn mt-2 ml-1" @click="storageDemo = inputValue">Save</button>
    </div>

    <div class="mt-4">
      Powered by Vite <pixelarticons-zap class="align-middle" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { storageDemo } from '~/logic/storage'
const inputValue = ref(storageDemo.value);
</script>
