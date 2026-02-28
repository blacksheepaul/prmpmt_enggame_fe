import { onUnmounted } from 'vue'
import { useRoomStore } from '../stores/roomStore'
import { connectSSE, type SSEConnection } from '../api/sse'

export function useSSE() {
  const store = useRoomStore()
  let connection: SSEConnection | null = null

  function connect(roomId: string) {
    // Disconnect any existing connection
    disconnect()

    const fromOffset = store.loadOffset(roomId)
    store.isReconnecting = false

    connection = connectSSE(
      roomId,
      fromOffset,
      (event) => store.dispatchEvent(event),
      () => {
        // onConnected
        store.isConnected = true
        store.isReconnecting = false
      },
      () => {
        // onDisconnected
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
