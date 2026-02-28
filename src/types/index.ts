// --- Room & Game State ---

export type RoomState = 'idle' | 'streaming' | 'cancelled' | 'done'

export interface Room {
  id: string
  scenery_id: string
  state: RoomState
  created_at?: string
}

export interface Turn {
  id: string
  room_id: string
  round: number
  user_input: string
  responses?: AgentResponse[]
  created_at?: string
}

export interface AgentResponse {
  agent_id: string
  content: string
}

export interface TurnHistory {
  round: number
  userInput: string
  responses: AgentResponse[]
}

// --- Scenery & Agent ---

export interface Scenery {
  id: string
  name: string
  description: string
  agents: Agent[]
}

export interface Agent {
  id: string
  name: string
  system_prompt: string
}

// --- SSE Event Payloads ---

export interface RoomCreatedPayload {
  id: string
  scenery_id: string
  state: RoomState
  offset: number
  created_at?: string
}

export interface TurnStartedPayload {
  turn_id: string
  round: number
  user_input: string
  offset: number
}

export interface TokenReceivedPayload {
  agent_id: string
  token: string
  offset: number
}

export interface TurnCompletedPayload {
  turn_id: string
  responses: AgentResponse[]
  offset: number
}

export interface TurnCancelledPayload {
  turn_id: string
  reason: string
  offset: number
}

export interface ErrorPayload {
  code: string
  message: string
  offset: number
}

export type SSEEventType =
  | 'room_created'
  | 'turn_started'
  | 'token_received'
  | 'turn_completed'
  | 'turn_cancelled'
  | 'error'

export interface SSEEvent {
  type: SSEEventType
  data: RoomCreatedPayload | TurnStartedPayload | TokenReceivedPayload | TurnCompletedPayload | TurnCancelledPayload | ErrorPayload
}

// --- API Responses ---

export interface CreateRoomResponse {
  id: string
  scenery_id: string
  state: RoomState
}

export interface SubmitAnswerResponse {
  turn_id: string
  round: number
}

// --- API Errors ---

export class ApiError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}
