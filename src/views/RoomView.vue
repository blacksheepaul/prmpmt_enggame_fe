<template>
  <div class="h-screen flex flex-col bg-slate-900">
    <!-- Status Bar -->
    <StatusBar />

    <!-- Chat History -->
    <ChatHistory class="flex-1 overflow-hidden" />

    <!-- Input Area -->
    <InputArea
      :disabled="store.currentState === 'streaming'"
      :is-streaming="store.currentState === 'streaming'"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '../stores/roomStore'
import { useRoom } from '../composables/useRoom'
import { useSSE } from '../composables/useSSE'
import StatusBar from '../components/StatusBar.vue'
import ChatHistory from '../components/ChatHistory.vue'
import InputArea from '../components/InputArea.vue'

const props = defineProps<{ id: string }>()
const route = useRoute()
const router = useRouter()
const store = useRoomStore()
const { submitAnswer, cancelCurrentTurn } = useRoom()
const { connect } = useSSE()

onMounted(() => {
  const roomId = props.id || (route.params.id as string)
  if (!roomId) {
    router.push({ name: 'welcome' })
    return
  }

  store.roomId = roomId
  connect(roomId)
})

async function onSubmit(text: string) {
  try {
    await submitAnswer(text)
  } catch {
    // Error is already set in store by useRoom
  }
}

async function onCancel() {
  await cancelCurrentTurn()
}
</script>
