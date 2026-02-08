<template>
  <div class="harptos-date-input">
    <!-- Display mode: shows the date as text -->
    <div 
      v-if="!showPicker"
      class="date-display"
      @click="openPicker"
      :class="{ 'has-value': modelValue, 'placeholder': !modelValue }"
      tabindex="0"
      @keydown.enter="openPicker"
      @keydown.space.prevent="openPicker"
      role="button"
      :aria-label="modelValue ? `Change date: ${modelValue}` : 'Set date'"
    >
      <span class="date-text">{{ displayText }}</span>
      <span class="calendar-icon">📅</span>
    </div>

    <!-- Picker overlay -->
    <teleport to="body">
      <div 
        v-if="showPicker" 
        class="date-picker-overlay"
        @click.self="closePicker"
      >
        <div class="date-picker-modal" @click.stop>
          <div class="modal-header">
            <h3>Select Game Date</h3>
            <button 
              @click="closePicker" 
              class="close-btn"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div class="modal-body">
            <HarptosDatePicker
              v-model="localValue"
              @update:modelValue="handleDateChange"
            />
          </div>
          <div class="modal-footer">
            <button @click="clearDate" class="btn btn-secondary">Clear</button>
            <button @click="closePicker" class="btn btn-primary">Done</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import HarptosDatePicker from './HarptosDatePicker.vue'

interface Props {
  modelValue: string | null
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select game date...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const showPicker = ref(false)
const localValue = ref<string | null>(props.modelValue)

const displayText = computed(() => {
  return props.modelValue || props.placeholder
})

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

function openPicker() {
  localValue.value = props.modelValue
  showPicker.value = true
}

function closePicker() {
  showPicker.value = false
}

function handleDateChange(newValue: string | null) {
  localValue.value = newValue
  emit('update:modelValue', newValue)
}

function clearDate() {
  localValue.value = null
  emit('update:modelValue', null)
  closePicker()
}
</script>

<style scoped>
.harptos-date-input {
  width: 100%;
}

.date-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #c9d1d9;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 38px;
}

.date-display:hover {
  border-color: #1f6feb;
  background: #161b22;
}

.date-display:focus {
  outline: none;
  border-color: #1f6feb;
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.1);
}

.date-display.placeholder .date-text {
  color: #6e7681;
}

.date-display.has-value .date-text {
  color: #c9d1d9;
}

.calendar-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.date-picker-modal {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #30363d;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #c9d1d9;
}

.close-btn {
  background: transparent;
  border: none;
  color: #8b949e;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #30363d;
  color: #c9d1d9;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #30363d;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn-secondary {
  background: #21262d;
  color: #c9d1d9;
  border-color: #30363d;
}

.btn-secondary:hover {
  background: #30363d;
}

.btn-primary {
  background: #238636;
  color: white;
}

.btn-primary:hover {
  background: #2ea043;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .date-picker-modal {
    max-width: 100%;
    margin: 0.5rem;
    max-height: calc(100vh - 1rem);
  }
}
</style>
