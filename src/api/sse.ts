import type { SSEEvent, SSEEventType } from '../types'

export type SSEEventHandler = (event: SSEEvent) => void

export interface SSEConnection {
  close: () => void
}

const MAX_RETRY_DELAY = 30_000
const INITIAL_RETRY_DELAY = 1_000

export function connectSSE(
  roomId: string,
  fromOffset: number,
  onEvent: SSEEventHandler,
  onConnected: () => void,
  onDisconnected: () => void,
): SSEConnection {
  let eventSource: EventSource | null = null
  let retryDelay = INITIAL_RETRY_DELAY
  let closed = false

  const eventTypes: SSEEventType[] = [
    'room_created',
    'turn_started',
    'token_received',
    'turn_completed',
    'turn_cancelled',
    'error',
  ]

  function connect() {
    if (closed) return

    const url = `/api/rooms/${roomId}/events?fromOffset=${fromOffset}`
    eventSource = new EventSource(url)

    eventSource.onopen = () => {
      retryDelay = INITIAL_RETRY_DELAY
      onConnected()
    }

    for (const type of eventTypes) {
      eventSource.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          // Track offset for reconnection
          if (typeof data.offset === 'number') {
            fromOffset = data.offset + 1
          }
          onEvent({ type, data })
        } catch (err) {
          console.error(`[SSE] Failed to parse ${type} event:`, err)
        }
      })
    }

    eventSource.onerror = () => {
      eventSource?.close()
      eventSource = null
      onDisconnected()

      if (!closed) {
        setTimeout(() => connect(), retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY)
      }
    }
  }

  connect()

  return {
    close() {
      closed = true
      eventSource?.close()
      eventSource = null
    },
  }
}
