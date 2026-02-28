import { fetchJSON } from './client'
import type { CreateRoomResponse, SubmitAnswerResponse } from '../types'

export function createRoom(sceneryId: string = 'default'): Promise<CreateRoomResponse> {
  return fetchJSON<CreateRoomResponse>('POST', '/rooms', { scenery_id: sceneryId })
}

export function submitAnswer(roomId: string, userInput: string): Promise<SubmitAnswerResponse> {
  return fetchJSON<SubmitAnswerResponse>('POST', `/rooms/${roomId}/answer`, { user_input: userInput })
}

export function cancelTurn(roomId: string): Promise<void> {
  return fetchJSON<void>('POST', `/rooms/${roomId}/cancel`)
}
