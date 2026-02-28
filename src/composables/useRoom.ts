import { useRoomStore } from '../stores/roomStore'
import * as roomsApi from '../api/rooms'
import type { ApiError } from '../types'

export function useRoom() {
  const store = useRoomStore()

  async function createNewRoom(sceneryId: string = 'default'): Promise<string> {
    store.reset()
    const res = await roomsApi.createRoom(sceneryId)
    store.roomId = res.id
    store.currentState = res.state
    return res.id
  }

  async function submitAnswer(userInput: string): Promise<void> {
    if (!store.roomId) throw new Error('No room connected')

    store.error = null
    try {
      await roomsApi.submitAnswer(store.roomId, userInput)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 409) {
        store.error = 'Interview in progress. Please wait.'
      } else if (apiErr.status === 400) {
        store.error = 'Invalid input. Please check your answer.'
      } else if (apiErr.status === 404) {
        store.error = 'Room not found.'
      } else {
        store.error = 'Something went wrong. Please try again.'
      }
      throw err
    }
  }

  async function cancelCurrentTurn(): Promise<void> {
    if (!store.roomId) return

    try {
      await roomsApi.cancelTurn(store.roomId)
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 409) {
        store.error = 'No active turn to cancel.'
      } else {
        store.error = 'Failed to cancel.'
      }
    }
  }

  return {
    createNewRoom,
    submitAnswer,
    cancelCurrentTurn,
  }
}
