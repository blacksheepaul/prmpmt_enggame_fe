<template>
  <div class="mx-auto max-w-2xl flex justify-end mb-3">
    <div class="bg-blue-600/20 border border-blue-700/30 rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
      <p class="text-xs text-blue-400 font-medium mb-1">You</p>
      <p class="text-slate-200 text-sm whitespace-pre-wrap">{{ content }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ content: string }>()
</script>
