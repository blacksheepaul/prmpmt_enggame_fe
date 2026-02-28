import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type {
  RoomState,
  TurnHistory,
  RoomCreatedPayload,
  TurnStartedPayload,
  TokenReceivedPayload,
  TurnCompletedPayload,
  TurnCancelledPayload,
  ErrorPayload,
  SSEEvent,
} from '../types'

// Default agent display names (fallback when backend doesn't provide them)
const DEFAULT_AGENT_NAMES: Record<string, string> = {
  'db-surgeon': 'DB Surgeon',
  'performance-nerd': 'Performance Nerd',
  'skeptic': 'Skeptic',
}

export const useRoomStore = defineStore('room', () => {
  // --- Connection ---
  const roomId = ref<string | null>(null)
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const lastEventOffset = ref(0)

  // --- Room state ---
  const currentState = ref<RoomState>('idle')
  const currentRound = ref(0)
  const currentUserInput = ref('')

  // --- Streaming ---
  const streamingResponses = reactive<Record<string, string>>({})
  const knownAgentIds = ref<string[]>([])

  // --- History ---
  const turns = ref<TurnHistory[]>([])

  // --- Error ---
  const error = ref<string | null>(null)

  // --- Agent names ---
  const agentNames = reactive<Record<string, string>>({})

  // --- Helpers ---

  function getAgentName(agentId: string): string {
    return agentNames[agentId] || DEFAULT_AGENT_NAMES[agentId] || agentId
  }

  function trackAgent(agentId: string) {
    if (!knownAgentIds.value.includes(agentId)) {
      knownAgentIds.value.push(agentId)
    }
  }

  // --- localStorage persistence ---

  function persistOffset() {
    if (roomId.value) {
      localStorage.setItem(`pe-offset-${roomId.value}`, String(lastEventOffset.value))
    }
  }

  function loadOffset(id: string): number {
    const stored = localStorage.getItem(`pe-offset-${id}`)
    return stored ? parseInt(stored, 10) : 0
  }

  // --- Event Handlers ---

  function handleRoomCreated(payload: RoomCreatedPayload) {
    // Don't overwrite roomId if already set from URL — the URL param is
    // the authoritative source. The SSE payload.id may differ (e.g. an
    // internal short ID) from the UUID returned by POST /rooms.
    if (!roomId.value) {
      roomId.value = payload.id
    }
    currentState.value = payload.state || 'idle'
    lastEventOffset.value = payload.offset
    error.value = null
    persistOffset()
  }

  function handleTurnStarted(payload: TurnStartedPayload) {
    currentState.value = 'streaming'
    currentRound.value = payload.round
    currentUserInput.value = payload.user_input
    lastEventOffset.value = payload.offset
    error.value = null

    // Clear streaming buffers
    for (const key of Object.keys(streamingResponses)) {
      delete streamingResponses[key]
    }

    persistOffset()
  }

  function handleTokenReceived(payload: TokenReceivedPayload) {
    const { agent_id, token } = payload
    trackAgent(agent_id)

    if (streamingResponses[agent_id] === undefined) {
      streamingResponses[agent_id] = ''
    }
    streamingResponses[agent_id] += token

    lastEventOffset.value = payload.offset
    persistOffset()
  }

  function handleTurnCompleted(payload: TurnCompletedPayload) {
    currentState.value = 'done'
    lastEventOffset.value = payload.offset

    // Build responses: prefer payload.responses from backend, fall back to
    // whatever we accumulated via streaming tokens.
    let responses = payload.responses
    if (!responses || responses.length === 0) {
      responses = Object.entries(streamingResponses)
        .filter(([, content]) => content.length > 0)
        .map(([agent_id, content]) => ({ agent_id, content }))
    }

    turns.value.push({
      round: currentRound.value || turns.value.length + 1,
      userInput: currentUserInput.value,
      responses: responses.map((r) => {
        trackAgent(r.agent_id)
        return { agent_id: r.agent_id, content: r.content }
      }),
    })

    // Clear streaming buffers
    for (const key of Object.keys(streamingResponses)) {
      delete streamingResponses[key]
    }

    persistOffset()
  }

  function handleTurnCancelled(payload: TurnCancelledPayload) {
    currentState.value = 'cancelled'
    lastEventOffset.value = payload.offset

    // Save whatever was streamed so far into history
    const partialResponses = Object.entries(streamingResponses)
      .filter(([, content]) => content.length > 0)
      .map(([agent_id, content]) => ({ agent_id, content: content + ' [cancelled]' }))

    if (partialResponses.length > 0 || currentUserInput.value) {
      turns.value.push({
        round: currentRound.value || turns.value.length + 1,
        userInput: currentUserInput.value,
        responses: partialResponses,
      })
    }

    // Clear streaming buffers
    for (const key of Object.keys(streamingResponses)) {
      delete streamingResponses[key]
    }

    persistOffset()
  }

  function handleError(payload: ErrorPayload) {
    error.value = payload.message || 'Unknown error'
    lastEventOffset.value = payload.offset
    persistOffset()
  }

  // --- Dispatch SSE event ---

  function dispatchEvent(event: SSEEvent) {
    switch (event.type) {
      case 'room_created':
        handleRoomCreated(event.data as RoomCreatedPayload)
        break
      case 'turn_started':
        handleTurnStarted(event.data as TurnStartedPayload)
        break
      case 'token_received':
        handleTokenReceived(event.data as TokenReceivedPayload)
        break
      case 'turn_completed':
        handleTurnCompleted(event.data as TurnCompletedPayload)
        break
      case 'turn_cancelled':
        handleTurnCancelled(event.data as TurnCancelledPayload)
        break
      case 'error':
        handleError(event.data as ErrorPayload)
        break
    }
  }

  function reset() {
    roomId.value = null
    isConnected.value = false
    isReconnecting.value = false
    lastEventOffset.value = 0
    currentState.value = 'idle'
    currentRound.value = 0
    currentUserInput.value = ''
    turns.value = []
    error.value = null
    knownAgentIds.value = []
    for (const key of Object.keys(streamingResponses)) {
      delete streamingResponses[key]
    }
    for (const key of Object.keys(agentNames)) {
      delete agentNames[key]
    }
  }

  return {
    // State
    roomId,
    isConnected,
    isReconnecting,
    lastEventOffset,
    currentState,
    currentRound,
    currentUserInput,
    streamingResponses,
    knownAgentIds,
    turns,
    error,
    agentNames,

    // Getters
    getAgentName,

    // Actions
    dispatchEvent,
    loadOffset,
    reset,
  }
})
