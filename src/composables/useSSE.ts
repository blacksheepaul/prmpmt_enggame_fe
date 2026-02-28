import { onUnmounted } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { connectSSE, type SSEConnection } from '../api/sse'

export function useSSE() {
  const store = useRoomStore()
  let connection: SSEConnection | null = null

  function connect(roomId: string) {
    disconnect()

    // Always replay from offset 0 on initial page load so the full event
    // history is replayed and the store is rebuilt from scratch.
    // The SSE manager internally tracks the latest offset and uses it when
    // auto-reconnecting after a dropped connection — that's the only case
    // where we skip already-seen events.
    store.isReplaying = true
    store.isReconnecting = false

    connection = connectSSE(
      roomId,
      0,
      (event) => store.dispatchEvent(event),
      () => {
        store.isConnected = true
        store.isReconnecting = false
      },
      () => {
        store.isConnected = false
        store.isReconnecting = true
      },
    )
  }

  function disconnect() {
    connection?.close()
    connection = null
    store.isConnected = false
    store.isReconnecting = false
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
  }
}
