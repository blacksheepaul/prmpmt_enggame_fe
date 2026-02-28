# Prompt Endgame - Frontend

An AI-powered group interview simulation game frontend. A human candidate is interviewed by multiple AI agents simultaneously, each with distinct personas.

## Tech Stack

- **Framework**: Vue 3 (Composition API + `<script setup>`)
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS v4

## Features

- **Multi-Agent Interview**: Simultaneous responses from multiple AI agents (DB Surgeon, Performance Nerd, Skeptic)
- **Real-time Streaming**: SSE-based token-by-token response streaming
- **Auto-reconnection**: Resilient SSE connection with exponential backoff and offset-based replay
- **Turn Management**: Submit answers, cancel ongoing turns, view history
- **Auto-scroll**: Chat history automatically scrolls to show new content
- **Keyboard Shortcuts**: `Cmd/Ctrl + Enter` to submit

## Core Game Loop

1. **Create Room** → Select scenario with multiple AI agents
2. **Submit Answer** → Answer the agents' questions
3. **Watch Streaming** → See each agent's response stream in real-time via SSE
4. **Cancel (Optional)** → Stop the current turn if needed
5. **Repeat** → Continue to next round

## Project Structure

```
src/
├── api/
│   ├── client.ts          # HTTP fetch wrapper
│   ├── rooms.ts           # Room CRUD API
│   └── sse.ts             # SSE connection manager with reconnection
├── components/
│   ├── AgentBubble.vue    # AI agent response bubble with streaming cursor
│   ├── ChatHistory.vue    # Scrollable chat history
│   ├── InputArea.vue      # Input textarea + Submit/Cancel buttons
│   ├── RoundDivider.vue   # Round separator
│   ├── StatusBar.vue      # Room status header
│   └── UserMessage.vue    # User message bubble
├── composables/
│   ├── useRoom.ts         # Room operations (create/submit/cancel)
│   └── useSSE.ts          # SSE lifecycle management
├── stores/
│   └── roomStore.ts       # Pinia global state (room, turns, streaming)
├── types/
│   └── index.ts           # TypeScript type definitions
├── views/
│   ├── WelcomeView.vue    # Room creation page
│   └── RoomView.vue       # Main interview interface
├── router/
│   └── index.ts           # Route definitions
├── App.vue
└── main.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Backend server running on `http://localhost:8080`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dev server runs on `http://localhost:5173` with proxy to backend (`/api` → `http://localhost:8080`).

### Build

```bash
npm run build
```

## API Integration

The frontend communicates with the backend via:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rooms` | Create interview room |
| `POST` | `/api/rooms/{id}/answer` | Submit candidate's answer |
| `GET`  | `/api/rooms/{id}/events` | **SSE Stream** - Real-time events |
| `POST` | `/api/rooms/{id}/cancel` | Cancel active streaming |

### SSE Events

| Event Type | Description |
|------------|-------------|
| `room_created` | Room initialized |
| `turn_started` | New turn begins |
| `token_received` | Agent outputs token (streaming) |
| `turn_completed` | Turn finished |
| `turn_cancelled` | Turn was cancelled |

## Room States

- `idle` - Ready for input
- `streaming` - Agents are responding
- `cancelled` - Turn was cancelled
- `done` - Turn completed

## Development Notes

### SSE Reconnection

The SSE connection automatically reconnects with exponential backoff (1s → 30s max). It uses `fromOffset` parameter to replay missed events on reconnect.

### Token Aggregation

Tokens are aggregated per-agent during streaming and stored in `streamingResponses` map. Each `token_received` event appends to the corresponding agent's buffer.

### Auto-focus

Input textarea automatically focuses when streaming ends (`disabled` prop changes to `false`).

## Testing Scenarios

1. **Happy Path**: Create room → Submit answer → Watch streaming → Submit next
2. **Cancellation**: Start turn → Click Cancel → Verify stopped
3. **Reconnection**: Start streaming → Refresh page → Verify history replay
4. **Error Handling**: Try to submit to non-existent room

## Future Enhancements

- Multiple scenery selection
- Real LLM providers (OpenAI, vLLM)
- Authentication
- Metrics dashboard
