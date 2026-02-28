<template>
  <div class="flex items-center gap-3 my-4 mx-auto max-w-2xl">
    <div class="flex-1 h-px bg-slate-700"></div>
    <span class="text-xs text-slate-500 font-medium uppercase tracking-wider">Round {{ round }}</span>
    <div class="flex-1 h-px bg-slate-700"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ round: number }>()
</script>
