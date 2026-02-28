<template>
  <div ref="scrollContainer" class="overflow-y-auto p-4 space-y-1" @scroll="onScroll">
    <!-- Empty state -->
    <div v-if="store.turns.length === 0 && !hasStreamingContent" class="flex items-center justify-center h-full">
      <div class="text-center text-slate-500">
        <p class="text-lg mb-2">Ready to begin</p>
        <p class="text-sm">Type your answer below to start the interview.</p>
      </div>
    </div>

    <!-- Completed Turns -->
    <template v-for="(turn, index) in store.turns" :key="`turn-${index}`">
      <RoundDivider :round="turn.round ?? (index + 1)" />
      <UserMessage :content="turn.userInput" />
      <AgentBubble
        v-for="response in turn.responses"
        :key="`${turn.round}-${response.agent_id}`"
        :agent-id="response.agent_id"
        :agent-name="store.getAgentName(response.agent_id)"
        :content="response.content"
        :is-streaming="false"
      />
    </template>

    <!-- Current Streaming Turn -->
    <template v-if="hasStreamingContent">
      <RoundDivider :round="store.currentRound || (store.turns.length + 1)" />
      <UserMessage :content="store.currentUserInput" />
      <AgentBubble
        v-for="agentId in streamingAgentIds"
        :key="`streaming-${agentId}`"
        :agent-id="agentId"
        :agent-name="store.getAgentName(agentId)"
        :content="store.streamingResponses[agentId] || ''"
        :is-streaming="store.currentState === 'streaming'"
      />
    </template>

    <!-- Error message -->
    <div v-if="store.error" class="mx-auto max-w-2xl p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">
      {{ store.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import RoundDivider from './RoundDivider.vue'
import UserMessage from './UserMessage.vue'
import AgentBubble from './AgentBubble.vue'

const store = useRoomStore()
const scrollContainer = ref<HTMLElement>()
const userScrolledUp = ref(false)

const streamingAgentIds = computed(() => {
  return Object.keys(store.streamingResponses)
})

const hasStreamingContent = computed(() => {
  return store.currentState === 'streaming'
})

function onScroll() {
  const el = scrollContainer.value
  if (!el) return
  // Consider "at bottom" if within 100px of the bottom
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  userScrolledUp.value = !atBottom
}

function scrollToBottom() {
  if (userScrolledUp.value) return
  nextTick(() => {
    const el = scrollContainer.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

// Auto-scroll on new content
watch(
  () => [
    store.turns.length,
    store.currentState,
    // Watch streaming content changes by serializing keys + last chars
    ...Object.values(store.streamingResponses).map(v => v.length),
  ],
  () => scrollToBottom(),
  { deep: true },
)
</script>
