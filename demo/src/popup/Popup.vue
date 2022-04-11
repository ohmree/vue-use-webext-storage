<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <Logo />
    <div>Popup</div>
    <p class="mt-2 opacity-50">This is the popup page</p>
    <button class="btn mt-2" @click="openOptionsPage">Open Options</button>
    <div class="mt-2" v-if="error == null">
      <span class="opacity-50">Storage:</span> {{ data }}
    </div>
    <div class="m-2" v-else>
      <span class="opacity-50 text-red-500">Error:</span> {{ error }}
    </div>
  </main>
</template>

<script setup lang="ts">
import { storageDemo } from '~/logic/storage';

const { data, error } = storageDemo;

function openOptionsPage() {
  browser.runtime.openOptionsPage();
}
</script>
