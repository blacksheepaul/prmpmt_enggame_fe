<template>
  <div class="bg-slate-800 border-t border-slate-700 px-4 py-3">
    <div class="mx-auto max-w-2xl">
      <!-- Error display -->
      <div v-if="store.error" class="mb-2 text-red-400 text-xs">
        {{ store.error }}
      </div>

      <!-- Textarea -->
      <div class="flex gap-2">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          :disabled="disabled"
          @keydown="onKeydown"
          placeholder="Type your answer... (Cmd+Enter to submit)"
          rows="2"
          class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        ></textarea>

        <div class="flex flex-col gap-2">
          <!-- Submit -->
          <button
            @click="handleSubmit"
            :disabled="disabled || !inputText.trim()"
            class="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Submit
          </button>

          <!-- Cancel -->
          <button
            @click="handleCancel"
            :disabled="!isStreaming"
            class="bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoomStore } from '../stores/roomStore'

const props = defineProps<{
  disabled: boolean
  isStreaming: boolean
}>()

const emit = defineEmits<{
  submit: [text: string]
  cancel: []
}>()

const store = useRoomStore()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

function handleSubmit() {
  const text = inputText.value.trim()
  if (!text || props.disabled) return
  emit('submit', text)
  inputText.value = ''
}

function handleCancel() {
  if (props.isStreaming) {
    emit('cancel')
  }
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
  }
}

// Auto-focus textarea when not streaming
watch(() => props.disabled, (isDisabled) => {
  if (!isDisabled) {
    setTimeout(() => textareaRef.value?.focus(), 100)
  }
})
</script>
