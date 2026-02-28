<template>
  <div>
    <!-- Reconnecting Banner -->
    <div
      v-if="store.isReconnecting"
      class="bg-amber-600 text-white text-center text-sm py-1.5 px-4"
    >
      Reconnecting to server...
    </div>

    <!-- Header -->
    <div class="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-white font-semibold text-lg">Prompt Endgame</h1>
        <span class="text-slate-500 text-xs font-mono" :title="store.roomId ?? ''">
          {{ shortRoomId }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- Round -->
        <span v-if="store.currentRound > 0" class="text-slate-400 text-sm">
          Round {{ store.currentRound }}
        </span>

        <!-- State Badge -->
        <span
          class="text-xs font-medium px-2.5 py-1 rounded-full"
          :class="stateBadgeClass"
        >
          {{ stateLabel }}
        </span>

        <!-- Connection dot -->
        <span
          class="w-2 h-2 rounded-full"
          :class="store.isConnected ? 'bg-green-400' : 'bg-red-400'"
          :title="store.isConnected ? 'Connected' : 'Disconnected'"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoomStore } from '../stores/roomStore'

const store = useRoomStore()

const shortRoomId = computed(() => {
  if (!store.roomId) return ''
  return store.roomId.length > 12
    ? store.roomId.slice(0, 8) + '...'
    : store.roomId
})

const stateLabel = computed(() => {
  switch (store.currentState) {
    case 'idle': return 'Idle'
    case 'streaming': return 'Streaming'
    case 'done': return 'Done'
    case 'cancelled': return 'Cancelled'
    default: return store.currentState
  }
})

const stateBadgeClass = computed(() => {
  switch (store.currentState) {
    case 'idle': return 'bg-slate-600 text-slate-300'
    case 'streaming': return 'bg-blue-600 text-blue-100 animate-pulse'
    case 'done': return 'bg-green-700 text-green-200'
    case 'cancelled': return 'bg-amber-700 text-amber-200'
    default: return 'bg-slate-600 text-slate-300'
  }
})
</script>
