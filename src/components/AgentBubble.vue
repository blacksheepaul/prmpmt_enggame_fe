<template>
  <div class="mx-auto max-w-2xl mb-3">
    <div
      class="rounded-xl rounded-bl-sm px-4 py-2.5 max-w-[90%]"
      :style="{ backgroundColor: bgColor, borderLeft: `3px solid ${accentColor}` }"
    >
      <!-- Agent Name -->
      <p class="text-xs font-semibold mb-1" :style="{ color: accentColor }">
        {{ agentName }}
      </p>

      <!-- Content -->
      <p class="text-slate-200 text-sm whitespace-pre-wrap">
        {{ content }}<span
          v-if="isStreaming && content"
          class="inline-block w-2 h-4 ml-0.5 align-text-bottom animate-pulse"
          :style="{ backgroundColor: accentColor }"
        ></span>
      </p>

      <!-- Empty streaming state -->
      <p v-if="isStreaming && !content" class="text-slate-500 text-sm italic">
        Thinking<span class="animate-pulse">...</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  agentId: string
  agentName: string
  content: string
  isStreaming: boolean
}>()

const AGENT_COLORS = [
  { accent: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },   // blue
  { accent: '#fb7185', bg: 'rgba(244, 63, 94, 0.1)' },     // rose
  { accent: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },    // emerald
  { accent: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },    // amber
  { accent: '#a78bfa', bg: 'rgba(139, 92, 246, 0.1)' },    // violet
]

const colorIndex = computed(() => {
  // Simple hash of agentId to pick a consistent color
  let hash = 0
  for (let i = 0; i < props.agentId.length; i++) {
    hash = (hash * 31 + props.agentId.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % AGENT_COLORS.length
})

const accentColor = computed(() => AGENT_COLORS[colorIndex.value]!.accent)
const bgColor = computed(() => AGENT_COLORS[colorIndex.value]!.bg)
</script>
