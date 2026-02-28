<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-900 p-4">
    <div class="w-full max-w-md">
      <div class="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <!-- Title -->
        <h1 class="text-3xl font-bold text-white text-center mb-2">
          Prompt Endgame
        </h1>
        <p class="text-slate-400 text-center mb-8">
          AI-powered group interview simulation. Face multiple AI agents who will challenge your answers from different angles.
        </p>

        <!-- Scenery Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-slate-300 mb-2">
            Interview Scenario
          </label>
          <select
            v-model="sceneryId"
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="default">Default - DB Surgeon, Performance Nerd, Skeptic</option>
          </select>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {{ errorMsg }}
        </div>

        <!-- Start Button -->
        <button
          @click="startInterview"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating Room...
          </span>
          <span v-else>Start Interview</span>
        </button>

        <!-- Agents Preview -->
        <div class="mt-8 pt-6 border-t border-slate-700">
          <p class="text-xs text-slate-500 uppercase tracking-wider mb-3">Your Interviewers</p>
          <div class="space-y-2">
            <div class="flex items-center gap-3 text-sm">
              <span class="w-2 h-2 rounded-full bg-blue-400"></span>
              <span class="text-slate-300">DB Surgeon</span>
              <span class="text-slate-500 text-xs">- Database optimization focus</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <span class="w-2 h-2 rounded-full bg-rose-400"></span>
              <span class="text-slate-300">Performance Nerd</span>
              <span class="text-slate-500 text-xs">- P99, I/O, buffer pools</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span class="text-slate-300">Skeptic</span>
              <span class="text-slate-500 text-xs">- Challenges all claims</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoom } from '../composables/useRoom'

const router = useRouter()
const { createNewRoom } = useRoom()

const sceneryId = ref('default')
const loading = ref(false)
const errorMsg = ref('')

async function startInterview() {
  loading.value = true
  errorMsg.value = ''

  try {
    const roomId = await createNewRoom(sceneryId.value)
    router.push({ name: 'room', params: { id: roomId } })
  } catch (err) {
    errorMsg.value = 'Failed to create room. Is the backend running on localhost:8080?'
    console.error('Failed to create room:', err)
  } finally {
    loading.value = false
  }
}
</script>
