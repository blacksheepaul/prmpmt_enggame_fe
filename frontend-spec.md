# Frontend Specification - Prompt Endgame

> **Version**: 1.0  
> **Date**: 2026-02-28  
> **Backend API Base URL**: `http://localhost:8080` (configurable)

---

## 1. Project Overview

**Prompt Endgame** is an AI-powered group interview simulation game. A human candidate is interviewed by multiple AI agents simultaneously. Each agent has a distinct persona that focuses on different aspects (e.g., database expert, performance nerd, skeptic).

### Core Game Loop

1. **Create Room** → Select a scenario with multiple AI agents
2. **Submit Answer** → Answer the agents' questions
3. **Watch Streaming** → See each agent's response stream in real-time via SSE
4. **Cancel (Optional)** → Stop the current turn if needed
5. **Repeat** → Continue to next round

---

## 2. Current Backend Capabilities

### 2.1 Implemented APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/rooms` | Create a new interview room |
| `POST` | `/rooms/{id}/answer` | Submit candidate's answer |
| `GET` | `/rooms/{id}/events` | **SSE Stream** - Real-time events |
| `POST` | `/rooms/{id}/cancel` | Cancel active streaming |
| `GET` | `/health` | Health check |

### 2.2 Event Types (SSE)

All events are streamed via SSE with the following format:

```
id: {offset}
event: {event_type}
data: {json_payload}

```

| Event Type | Description | Payload Structure |
|------------|-------------|-------------------|
| `room_created` | Room initialized | `{ id, scenery_id, state, created_at }` |
| `turn_started` | New turn begins | `{ turn_id, round, user_input }` |
| `token_received` | Agent outputs token | `{ agent_id, token }` |
| `turn_completed` | Turn finished | `{ turn_id, responses: [{agent_id, content}] }` |
| `turn_cancelled` | Turn was cancelled | `{ turn_id, reason }` |
| `error` | Error occurred | `{ code, message }` |

### 2.3 Scenery (Interview Scenario)

A scenery defines the interview setup:

```typescript
interface Scenery {
  id: string;           // e.g., "default", "system_design"
  name: string;         // Display name
  description: string;  // Brief description
  agents: Agent[];      // List of AI interviewers
}

interface Agent {
  id: string;           // Unique agent ID
  name: string;         // Display name (e.g., "DB Surgeon")
  system_prompt: string; // Agent's personality/instructions
}
```

**Current Default Scenery** (hardcoded in backend):
- **DB Surgeon**: Focus on database optimization
- **Performance Nerd**: Obsessed with P99, I/O, buffer pools
- **Skeptic**: Challenges all claims

---

## 3. API Specifications

### 3.1 Create Room

```http
POST /rooms
Content-Type: application/json

{
  "scenery_id": "default"  // Optional, defaults to "default"
}
```

**Response (201 Created)**:
```json
{
  "id": "room-uuid-string",
  "scenery_id": "default",
  "state": "idle"
}
```

### 3.2 Submit Answer

```http
POST /rooms/{id}/answer
Content-Type: application/json

{
  "user_input": "Your answer text here..."
}
```

**Response (202 Accepted)**:
```json
{
  "turn_id": "turn-uuid-string",
  "round": 1
}
```

**Errors**:
- `400 Bad Request`: Invalid input or missing `user_input`
- `404 Not Found`: Room doesn't exist
- `409 Conflict`: Room is busy (streaming in progress)

### 3.3 Stream Events (SSE)

```http
GET /rooms/{id}/events?fromOffset={offset}
Accept: text/event-stream
Last-Event-ID: {last_received_offset}  // Alternative to query param
```

**Key Features**:
- **Reconnection Support**: Use `fromOffset` query param or `Last-Event-ID` header to resume
- **Atomic**: Historical events + live events streamed seamlessly
- **Offset**: Event sequence number (0, 1, 2, ...)

**Example SSE Data**:
```
id: 0
event: room_created
data: {"id":"r-xxx","scenery_id":"default","state":"idle","offset":0,...}

id: 1
event: turn_started
data: {"turn_id":"t-xxx","round":1,"user_input":"Hello","offset":1,...}

id: 2
event: token_received
data: {"agent_id":"agent-1","token":"That's","offset":2,...}

id: 3
event: token_received
data: {"agent_id":"agent-2","token":"I","offset":3,...}

id: 4
event: token_received
data: {"agent_id":"agent-1","token":"interesting","offset":4,...}

id: 5
event: turn_completed
data: {"turn_id":"t-xxx","responses":[{"agent_id":"agent-1","content":"That's interesting..."},...],"offset":5,...}
```

### 3.4 Cancel Turn

```http
POST /rooms/{id}/cancel
```

**Response**: `204 No Content`

**Errors**:
- `404 Not Found`: Room doesn't exist
- `409 Conflict`: No active turn to cancel

---

## 4. State Management

### 4.1 Room States

```typescript
type RoomState = 'idle' | 'streaming' | 'cancelled' | 'done';
```

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| `idle` | Ready for input | Submit answer |
| `streaming` | Agents are responding | Cancel, wait for completion |
| `cancelled` | Turn was cancelled | Submit new answer |
| `done` | Turn completed | Submit new answer |

### 4.2 Client-Side State (Recommended)

```typescript
interface AppState {
  // Connection
  roomId: string | null;
  isConnected: boolean;
  lastEventOffset: number;
  
  // Current turn
  currentState: RoomState;
  currentRound: number;
  userInput: string;
  
  // Streaming responses
  streamingResponses: Map<string, string>; // agent_id -> accumulated content
  
  // History
  turns: TurnHistory[];
}

interface TurnHistory {
  round: number;
  userInput: string;
  responses: AgentResponse[];
  completedAt: Date;
}

interface AgentResponse {
  agentId: string;
  agentName: string;
  content: string;
}
```

---

## 5. UI Requirements

### 5.1 Core Screens

#### Screen 1: Welcome / Room Creation
- Title and brief description
- Scenery selection dropdown (default: "default")
- "Start Interview" button → POST /rooms → redirect to Room

#### Screen 2: Interview Room (Main Interface)

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Header: Room ID, Round X, Status [Idle/Streaming]│
├─────────────────────────────────────────────────┤
│                                                 │
│  Chat History (scrollable)                      │
│  ─────────────────────────────────────────────  │
│  Round 1                                        │
│  [You]: Your question/answer                    │
│  [Agent 1]: Response content...                 │
│  [Agent 2]: Response content...                 │
│  [Agent 3]: Response content...                 │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Current Turn (if streaming)                    │
│  [Agent 1]: Partial streaming text... █         │
│  [Agent 2]: Partial streaming text... █         │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Input Area                                     │
│  ┌─────────────────────────────────────────┐    │
│  │ Type your answer...                     │    │
│  └─────────────────────────────────────────┘    │
│  [Submit]  [Cancel] (enabled when streaming)   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Requirements**:
1. **Auto-scroll**: Chat area auto-scrolls to bottom on new messages
2. **Streaming Indicator**: Blinking cursor (█) or "typing" animation during streaming
3. **Agent Cards**: Display each agent's name with color/icon distinction
4. **Cancel Button**: Only enabled when `state === 'streaming'`
5. **Input State**: Disabled when streaming
6. **Reconnection Banner**: Show when SSE reconnecting

#### Screen 3: Error / Not Found
- Error message display
- "Create New Room" button

### 5.2 SSE Reconnection Logic

**Must Implement**:
```typescript
// Pseudocode for SSE connection management
function connectSSE(roomId: string, lastOffset: number = 0) {
  const eventSource = new EventSource(
    `/rooms/${roomId}/events?fromOffset=${lastOffset}`
  );
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    lastOffset = data.offset; // Update for reconnection
    handleEvent(data);
  };
  
  eventSource.onerror = (error) => {
    eventSource.close();
    // Reconnect after delay (exponential backoff)
    setTimeout(() => connectSSE(roomId, lastOffset), 1000);
  };
  
  return eventSource;
}
```

**Key Points**:
- Store `lastEventOffset` locally (localStorage or state)
- On reconnect, use `fromOffset={lastOffset + 1}`
- Handle browser refresh: read offset from localStorage
- Visual indicator during reconnection

### 5.3 Token Aggregation Display

When receiving `token_received` events:

```typescript
function handleTokenReceived(event: TokenReceivedEvent) {
  const { agent_id, token } = event.payload;
  
  // Append token to agent's buffer
  streamingResponses.set(
    agent_id, 
    (streamingResponses.get(agent_id) || '') + token
  );
  
  // Re-render agent's message bubble
  updateAgentDisplay(agent_id, streamingResponses.get(agent_id));
}
```

**Display Considerations**:
- Tokens may arrive rapidly (50ms interval in mock)
- Use efficient DOM updates (React: useState batching, Vue: nextTick)
- Consider debouncing re-renders for very high token rates

---

## 6. Data Types Reference

```typescript
// Domain Types
interface Room {
  id: string;
  scenery_id: string;
  state: 'idle' | 'streaming' | 'cancelled' | 'done';
  current_turn?: Turn;
  created_at: string;
}

interface Turn {
  id: string;
  room_id: string;
  round: number;
  user_input: string;
  responses?: Response[];
  created_at: string;
}

interface Response {
  agent_id: string;
  content: string;
}

// Event Types
interface Event {
  id: string;
  type: EventType;
  room_id: string;
  turn_id?: string;
  offset: number;
  timestamp: string;
  payload?: any;
}

type EventType = 
  | 'room_created' 
  | 'turn_started' 
  | 'token_received' 
  | 'turn_completed' 
  | 'turn_cancelled' 
  | 'error';

interface TokenPayload {
  agent_id: string;
  token: string;
}

interface TurnCompletedPayload {
  turn_id: string;
  responses: Response[];
}
```

---

## 7. Recommended Tech Stack

### 7.1 Minimal Setup (Recommended for MVP)

```
- Framework: Vanilla TypeScript or React 18+
- Build Tool: Vite (fast dev server)
- Styling: Tailwind CSS or plain CSS
- State: React Context or Zustand (lightweight)
- HTTP Client: Native fetch
- SSE: Native EventSource API
```

### 7.2 File Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts       # HTTP client wrapper
│   │   ├── rooms.ts        # Room API calls
│   │   └── sse.ts          # SSE connection manager
│   ├── components/
│   │   ├── ChatMessage.tsx
│   │   ├── AgentBubble.tsx
│   │   ├── InputArea.tsx
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useRoom.ts      # Room state management
│   │   ├── useSSE.ts       # SSE connection hook
│   │   └── useScenery.ts   # Scenery data
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── store/
│   │   └── roomStore.ts    # Global state (optional)
│   ├── pages/
│   │   ├── Welcome.tsx
│   │   └── InterviewRoom.tsx
│   ├── utils/
│   │   └── eventHandlers.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

---

## 8. Error Handling

### 8.1 HTTP Errors

| Status | User Message | Action |
|--------|--------------|--------|
| 400 | "Invalid input. Please check your answer." | Keep input, allow retry |
| 404 | "Room not found. Create a new one?" | Redirect to Welcome |
| 409 | "Interview in progress. Please wait." | Disable submit, show spinner |
| 500 | "Something went wrong. Please try again." | Retry button |

### 8.2 SSE Errors

- **Connection Lost**: Show "Reconnecting..." banner
- **Parse Error**: Log to console, continue
- **Room Not Found (404 on SSE)**: Redirect to Welcome

---

## 9. Development Workflow

### 9.1 Running Backend Locally

```bash
# In backend repo
go run cmd/server/main.go

# Server runs on :8080 with CORS enabled
```

### 9.2 Mock Provider Behavior

The backend uses a mock LLM provider that:
- Splits responses by whitespace
- Streams one token every 50ms
- Generates placeholder text
- Supports cancellation (stops mid-stream)

### 9.3 Testing Scenarios

1. **Happy Path**: Create room → Submit answer → Watch streaming → Submit next
2. **Cancellation**: Start turn → Click Cancel → Verify stopped
3. **Reconnection**: Start streaming → Refresh page → Verify history replay
4. **Error Handling**: Try to submit to non-existent room

---

## 10. Future Enhancements (Not Yet Implemented)

The following features are planned but **not yet available** in the backend:

- WebSocket control plane (currently HTTP only)
- Real LLM providers (OpenAI, vLLM)
- Multiple scenery selection
- Authentication
- Metrics dashboard

**Frontend should be designed to accommodate these additions.**

---

## 11. Quick Start Checklist

- [ ] Set up Vite + React + TypeScript project
- [ ] Configure proxy to backend (`/api` → `http://localhost:8080`)
- [ ] Implement API client for 4 endpoints
- [ ] Implement SSE hook with reconnection
- [ ] Build Welcome page (room creation)
- [ ] Build Interview page (chat interface)
- [ ] Test all 4 scenarios (happy path, cancel, reconnect, errors)
- [ ] Add loading states and error boundaries

---

## Appendix: Sample API Interaction Flow

```
1. User clicks "Start Interview"
   → POST /rooms { scenery_id: "default" }
   ← 201 { id: "room-123", state: "idle" }
   
2. User types answer, clicks Submit
   → POST /rooms/room-123/answer { user_input: "Hello" }
   ← 202 { turn_id: "turn-456", round: 1 }
   
3. Frontend opens SSE connection
   → GET /rooms/room-123/events
   
4. Receive events:
   ← turn_started
   ← token_received (agent-1, "That's")
   ← token_received (agent-2, "I")
   ← token_received (agent-1, "interesting")
   ← ... (more tokens)
   ← turn_completed
   
5. User sees completed responses, can submit next answer
```
