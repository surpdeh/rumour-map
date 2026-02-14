<template>
  <div
    ref="clusterRef"
    class="cluster-marker"
    :class="{
      'is-expanded': isExpanded,
      'is-hovered': isHovered
    }"
    :style="clusterStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click.stop="toggleExpand"
    :tabindex="0"
    :aria-label="`Cluster of ${cluster.rumours.length} rumours`"
    :aria-expanded="isExpanded"
    role="button"
  >
    <!-- Cluster icon with badge -->
    <div v-if="!isExpanded" class="cluster-icon-container">
      <span class="cluster-icon">📍</span>
      <span class="cluster-badge">{{ cluster.rumours.length }}</span>
    </div>

    <!-- Expanded cluster - show individual rumours as accordion -->
    <div v-if="isExpanded" class="cluster-expanded">
      <div
        v-for="rumour in cluster.rumours"
        :key="rumour.id"
        class="cluster-rumour-item"
        :class="{ 'is-expanded': expandedRumourId === rumour.id }"
      >
        <!-- Accordion header: icon + title + controls -->
        <div 
          class="cluster-rumour-header"
          :class="{ 'is-drag-mode': isDragModeForRumour(rumour.id) }"
          @mousedown="handleHeaderMouseDown(rumour, $event)"
          @touchstart="handleHeaderTouchStart(rumour, $event)"
        >
          <!-- Pin/Drag toggle button -->
          <button
            class="pin-button"
            @click.stop="handleToggleDragMode(rumour)"
            @mousedown="handleButtonMouseDown(rumour, $event)"
            @touchstart="handleButtonTouchStart(rumour, $event)"
            :aria-label="isDragModeForRumour(rumour.id) ? 'Exit drag mode' : 'Enter drag mode'"
            :title="isDragModeForRumour(rumour.id) ? 'Click to exit drag mode' : 'Click to enable dragging'"
          >
            <span v-if="isDragModeForRumour(rumour.id)" class="drag-handle">⋮⋮</span>
            <span v-else-if="rumour.is_a_place" class="place-marker">⌘</span>
            <span v-else>📍</span>
          </button>
          
          <!-- Title (clickable to expand) -->
          <span 
            class="rumour-title"
            @click.stop="handleRumourClick(rumour)"
            @keydown.enter.prevent="handleRumourClick(rumour)"
            @keydown.space.prevent="handleRumourClick(rumour)"
            :tabindex="0"
            :aria-expanded="expandedRumourId === rumour.id"
            :aria-label="`${rumour.title} - Press Enter or Space to expand details`"
            role="button"
          >
            {{ rumour.title }}
          </span>
          
          <!-- Modified indicator -->
          <span 
            v-if="rumour.isModified" 
            class="modified-indicator" 
            aria-label="Modified, pending push"
            :title="getModifiedFieldsText(rumour)"
          >
            ⚠️
          </span>
          
          <!-- Edit button (only shown when expanded) -->
          <button
            v-if="expandedRumourId === rumour.id"
            class="edit-button"
            @click.stop="handleEdit(rumour)"
            @mousedown.stop
            aria-label="Edit rumour details"
            title="Edit rumour details"
          >
            ✏️
          </button>
          
          <!-- Expand indicator (clickable) -->
          <span 
            class="expand-indicator"
            @click.stop="handleRumourClick(rumour)"
            @keydown.enter.prevent="handleRumourClick(rumour)"
            @keydown.space.prevent="handleRumourClick(rumour)"
            :tabindex="0"
            aria-label="Toggle rumour details"
            role="button"
          >
            {{ expandedRumourId === rumour.id ? '▼' : '▶' }}
          </span>

        </div>

        <!-- Accordion content: rumour details -->
        <transition name="accordion">
          <div v-if="expandedRumourId === rumour.id" class="cluster-rumour-details">
            <!-- Edit Mode -->
            <div v-if="editingRumourId === rumour.id" class="edit-form">
              <div class="edit-field">
                <label class="edit-label">Title:</label>
                <input
                  v-model="editData.title"
                  class="edit-input edit-title"
                  type="text"
                  placeholder="Title"
                  @click.stop
                />
              </div>
              <div class="edit-field">
                <label class="edit-label">Session Date:</label>
                <input
                  v-model="editData.session_date"
                  class="edit-input"
                  type="text"
                  placeholder="Session date"
                  @click.stop
                />
              </div>
              <div class="edit-field edit-field-full">
                <label class="edit-label">Game Date (Harptos Calendar):</label>
                <HarptosDateInput
                  v-model="editData.game_date"
                  placeholder="e.g., 15 Hammer, 1492 DR"
                  @click.stop
                />
              </div>
              <div class="edit-field">
                <label class="edit-label">Heard at:</label>
                <input
                  v-model="editData.location_heard"
                  class="edit-input"
                  type="text"
                  placeholder="Location heard"
                  @click.stop
                />
              </div>
              <div class="edit-field">
                <label class="edit-label">About:</label>
                <input
                  v-model="editData.location_targetted"
                  class="edit-input"
                  type="text"
                  placeholder="Location targetted"
                  @click.stop
                />
              </div>
              <div class="edit-field">
                <label class="edit-label">Rating:</label>
                <input
                  v-model.number="editData.rating"
                  class="edit-input"
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Rating (0-10)"
                  @click.stop
                />
              </div>
              <div class="edit-field edit-checkbox">
                <label class="edit-label">
                  <input
                    v-model="editData.is_a_place"
                    type="checkbox"
                    @click.stop
                  />
                  Place
                </label>
              </div>
              <div class="edit-field edit-checkbox">
                <label class="edit-label">
                  <input
                    v-model="editData.resolved"
                    type="checkbox"
                    @click.stop
                  />
                  Resolved
                </label>
              </div>
              <div class="edit-field edit-field-full">
                <label class="edit-label">Details:</label>
                <textarea
                  v-model="editData.details"
                  class="edit-input edit-textarea"
                  placeholder="Details"
                  rows="3"
                  @click.stop
                ></textarea>
              </div>
              <div class="edit-actions">
                <button
                  class="edit-action-button save-button"
                  @click.stop="saveEdits(rumour)"
                >
                  Save
                </button>
                <button
                  class="edit-action-button cancel-button"
                  @click.stop="cancelEditing"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <!-- Read-only Mode -->
            <template v-else>
              <!-- Metadata Section -->
              <div v-if="hasMetadata(rumour)" class="metadata-section">
                <div v-if="rumour.session_date" class="metadata-item">
                  <span class="metadata-label">Session:</span>
                  <span class="metadata-value">{{ formatDate(rumour.session_date) }}</span>
                </div>
                <div v-if="rumour.game_date" class="metadata-item">
                  <span class="metadata-label">Game Date:</span>
                  <span class="metadata-value">{{ rumour.game_date }}</span>
                </div>
                <div v-if="rumour.location_heard" class="metadata-item">
                  <span class="metadata-label">Heard at:</span>
                  <span class="metadata-value">{{ rumour.location_heard }}</span>
                </div>
                <div v-if="rumour.location_targetted" class="metadata-item">
                  <span class="metadata-label">About:</span>
                  <span class="metadata-value">{{ rumour.location_targetted }}</span>
                </div>
                <div v-if="rumour.rating !== null && rumour.rating !== undefined" class="metadata-item">
                  <span class="metadata-label">Rating:</span>
                  <span class="metadata-value">⭐ {{ rumour.rating }}/10</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">Status:</span>
                  <span :class="['metadata-value', rumour.resolved ? 'status-resolved' : 'status-unresolved']">
                    {{ rumour.resolved ? '✓ Resolved' : '○ Unresolved' }}
                  </span>
                </div>
              </div>

              <!-- Details Section -->
              <div v-if="rumour.details" class="details-section">
                {{ rumour.details }}
              </div>
              <div v-else class="details-section empty">
                <em>No details provided</em>
              </div>
            </template>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import type { ClusteredRumour, MapTransform } from '../composables/useRumourClustering'
import { useRumourUpdates } from '@/composables/useRumourUpdates'
import HarptosDateInput from './HarptosDateInput.vue'

const props = defineProps<{
  cluster: ClusteredRumour
  mapTransform: MapTransform
  isPanning: boolean
}>()

const emit = defineEmits<{
  'toggle-pin': [rumour: any]
  'drag-start': [data: any]
}>()

const clusterRef = ref<HTMLElement | null>(null)
const isExpanded = ref(false)
const isHovered = ref(false)
const expandedRumourId = ref<string | null>(null)
const dragModeRumours = ref<Set<string>>(new Set())
const editingRumourId = ref<string | null>(null)
const editData = ref({
  title: '',
  session_date: '',
  game_date: '',
  location_heard: '',
  location_targetted: '',
  is_a_place: false,
  rating: null as number | null,
  resolved: false,
  details: ''
})

const { markFieldAsModified } = useRumourUpdates()

// Interactive control selectors for event delegation
const INTERACTIVE_CONTROLS = '.pin-button, .edit-button, .expand-indicator, .rumour-title'

const clusterStyle = computed(() => {
  return {
    left: `${props.cluster.screenX}px`,
    top: `${props.cluster.screenY}px`,
    zIndex: isExpanded.value ? 103 : (isHovered.value ? 101 : 100)
  }
})

const handleMouseEnter = () => {
  if (!props.isPanning) {
    isHovered.value = true
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  // Reset expanded rumour when collapsing cluster
  if (!isExpanded.value) {
    expandedRumourId.value = null
  }
}

// Handle clicks outside the cluster to collapse it
const handleClickOutside = (event: MouseEvent) => {
  if (clusterRef.value && !clusterRef.value.contains(event.target as Node)) {
    isExpanded.value = false
    expandedRumourId.value = null
  }
}

// Watch isExpanded to add/remove click-outside listener
watch(isExpanded, (newValue) => {
  if (newValue) {
    // Add listener after next tick to avoid immediate collapse from the click that opened it
    nextTick(() => {
      document.addEventListener('click', handleClickOutside)
    })
  } else {
    // Remove listener when collapsed
    document.removeEventListener('click', handleClickOutside)
  }
})

// Clean up listener on component unmount
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleRumourClick = (rumour: any) => {
  // Toggle accordion: expand/collapse individual rumour
  if (expandedRumourId.value === rumour.id) {
    expandedRumourId.value = null
  } else {
    expandedRumourId.value = rumour.id
  }
}

const handleToggleDragMode = (rumour: any) => {
  if (dragModeRumours.value.has(rumour.id)) {
    // Exiting drag mode - reset dragging state if currently dragging
    if (rumour.isDragging) {
      rumour.isDragging = false
    }
    dragModeRumours.value.delete(rumour.id)
  } else {
    dragModeRumours.value.add(rumour.id)
  }
  // Force reactivity
  dragModeRumours.value = new Set(dragModeRumours.value)
}

const isDragModeForRumour = (rumourId: string) => {
  return dragModeRumours.value.has(rumourId)
}

const handleDragStart = (rumour: any, event: MouseEvent | TouchEvent) => {
  // Only allow dragging if in drag mode
  if (isDragModeForRumour(rumour.id)) {
    emit('drag-start', { rumour, event })
  }
}

const handleButtonMouseDown = (rumour: any, event: MouseEvent) => {
  // If in drag mode, detect drag on button mousedown (but let click still toggle)
  if (isDragModeForRumour(rumour.id) && event.button === 0) {
    // Small delay to distinguish between click (toggle) and drag
    const startX = event.clientX
    const startY = event.clientY
    const threshold = 3 // pixels
    
    const handleMove = (moveEvent: MouseEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX)
      const dy = Math.abs(moveEvent.clientY - startY)
      
      if (dx > threshold || dy > threshold) {
        // It's a drag, not a click - pass the move event for accurate coordinates
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
        // Stop the event to prevent the click from firing
        event.stopPropagation()
        handleDragStart(rumour, moveEvent)
      }
    }
    
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
      // It was a click, let the click handler handle it
    }
    
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }
}

const handleButtonTouchStart = (rumour: any, event: TouchEvent) => {
  // For touch in drag mode, start drag
  if (isDragModeForRumour(rumour.id)) {
    handleDragStart(rumour, event)
  }
}

const handleHeaderMouseDown = (rumour: any, event: MouseEvent) => {
  // If in drag mode, start drag on header mousedown
  if (isDragModeForRumour(rumour.id) && event.button === 0) {
    // Check if click was on an interactive element
    const target = event.target as HTMLElement
    if (target.closest(INTERACTIVE_CONTROLS)) {
      return // Let the control handle it
    }
    handleDragStart(rumour, event)
  }
}

const handleHeaderTouchStart = (rumour: any, event: TouchEvent) => {
  // If in drag mode, start drag on header touch
  if (isDragModeForRumour(rumour.id)) {
    // Check if touch was on an interactive element
    const target = event.target as HTMLElement
    if (target.closest(INTERACTIVE_CONTROLS)) {
      return // Let the control handle it
    }
    handleDragStart(rumour, event)
  }
}

const handleEdit = (rumour: any) => {
  editingRumourId.value = rumour.id
  // Copy current values to edit data
  editData.value = {
    title: rumour.title,
    session_date: rumour.session_date || '',
    game_date: rumour.game_date || '',
    location_heard: rumour.location_heard || '',
    location_targetted: rumour.location_targetted || '',
    is_a_place: rumour.is_a_place,
    rating: rumour.rating,
    resolved: rumour.resolved,
    details: rumour.details || ''
  }
}

const saveEdits = (rumour: any) => {
  // Check what fields have changed and mark them as modified
  const editableFields = ['title', 'session_date', 'game_date', 'location_heard', 'location_targetted', 'is_a_place', 'rating', 'resolved', 'details']
  
  editableFields.forEach(fieldName => {
    const newValue = editData.value[fieldName as keyof typeof editData.value]
    const oldValue = rumour.originalValues?.[fieldName]
    
    // Handle null/empty string equivalence and type coercion
    const normalizedNew = (newValue === '' || newValue === null || newValue === undefined) ? null : newValue
    const normalizedOld = (oldValue === '' || oldValue === null || oldValue === undefined) ? null : oldValue
    
    // Use loose equality (!=) intentionally for type coercion between null/undefined
    // This handles cases where Google Sheets may return undefined vs null vs empty string
    // eslint-disable-next-line eqeqeq
    if (normalizedNew != normalizedOld) {
      // Update the rumour object (note: direct mutation is acceptable here as rumour is a reactive object)
      rumour[fieldName] = normalizedNew
      
      // Mark field as modified
      markFieldAsModified(rumour, fieldName)
    }
  })
  
  editingRumourId.value = null
}

const cancelEditing = () => {
  editingRumourId.value = null
  editData.value = {
    title: '',
    session_date: '',
    game_date: '',
    location_heard: '',
    location_targetted: '',
    is_a_place: false,
    rating: null,
    resolved: false,
    details: ''
  }
}

// Get a text description of modified fields
const getModifiedFieldsText = (rumour: any) => {
  if (!rumour.modifiedFields || rumour.modifiedFields.size === 0) {
    return 'Position changed - click Push Updates to save'
  }
  const fields = Array.from(rumour.modifiedFields).join(', ')
  return `Modified fields: ${fields} - click Push Updates to save`
}

// Check if rumour has any metadata to display
const hasMetadata = (rumour: any) => {
  return !!(
    rumour.session_date ||
    rumour.game_date ||
    rumour.location_heard ||
    rumour.location_targetted ||
    (rumour.rating !== null && rumour.rating !== undefined)
  )
}

// Format date for display
const formatDate = (dateString: string) => {
  if (!dateString) return 'Not specified'
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString // Return original if parsing fails
    
    // Use browser's default locale
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (e) {
    return dateString // Return original on error
  }
}
</script>

<style scoped>
:root {
  --pin-size: 35px;
}

.cluster-marker {
  position: absolute;
  background-color: rgba(22, 27, 34, 0.9);
  border: 1px solid #58a6ff;
  border-radius: 6px;
  padding: 0.25rem;
  width: var(--pin-size);
  height: var(--pin-size);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease-out;
  transform-origin: top left;
  pointer-events: auto;
  cursor: pointer;
}

.cluster-marker:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.cluster-marker:focus {
  outline: 2px solid #58a6ff;
  outline-offset: 2px;
}

.cluster-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cluster-icon {
  font-size: 1.2rem;
  line-height: 1;
  user-select: none;
}

.cluster-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #d29922;
  color: #0d1117;
  font-size: 0.625rem;
  font-weight: bold;
  padding: 0.125rem 0.25rem;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  border: 1px solid #0d1117;
  user-select: none;
}

.cluster-marker.is-expanded {
  background-color: rgba(22, 27, 34, 0.95);
  width: auto;
  height: auto;
  max-width: 400px;
  padding: 0.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.cluster-expanded {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-width: 250px;
}

.cluster-rumour-item {
  background-color: rgba(13, 17, 23, 0.8);
  border: 1px solid #30363d;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s ease-out;
}

.cluster-rumour-item:hover {
  border-color: #58a6ff;
  background-color: rgba(13, 17, 23, 0.95);
}

.cluster-rumour-item.is-expanded {
  border-color: #58a6ff;
}

.cluster-rumour-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  user-select: none;
}

.cluster-rumour-header:hover {
  background-color: rgba(88, 166, 255, 0.05);
}

.cluster-rumour-header.is-drag-mode {
  cursor: grab;
  background-color: rgba(210, 153, 34, 0.1);
}

.cluster-rumour-header.is-drag-mode:active {
  cursor: grabbing;
}

.pin-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  transition: transform 0.1s;
  flex-shrink: 0;
}

.pin-button span {
  display: inline-block;
}

/* Drag handle - white/light color for visibility */
.pin-button .drag-handle {
  color: #c9d1d9;
}

/* Place marker - red for visibility */
.pin-button .place-marker {
  color: #ff6b6b;
}

.pin-button:hover {
  transform: scale(1.2);
}

.pin-button:active {
  transform: scale(0.9);
}

.rumour-icon {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
}

.rumour-title {
  flex: 1;
  color: #c9d1d9;
  font-size: 0.875rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.rumour-title:hover {
  color: #58a6ff;
}

.rumour-title:focus {
  outline: 2px solid #58a6ff;
  outline-offset: -2px;
  border-radius: 2px;
}

.modified-indicator {
  font-size: 1rem;
  line-height: 1;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.edit-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1;
  transition: transform 0.1s;
  flex-shrink: 0;
}

.edit-button:hover {
  transform: scale(1.2);
}

.edit-button:active {
  transform: scale(0.9);
}

.expand-indicator {
  color: #8b949e;
  font-size: 0.75rem;
  flex-shrink: 0;
  transition: transform 0.2s;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 2px;
}

.expand-indicator:hover {
  color: #c9d1d9;
  background-color: rgba(88, 166, 255, 0.1);
}

.expand-indicator:focus {
  outline: 2px solid #58a6ff;
  outline-offset: -2px;
}

.drag-handle {
  color: #8b949e;
  font-size: 1rem;
  line-height: 1;
  cursor: grab;
  flex-shrink: 0;
  padding: 0 0.25rem;
  user-select: none;
}

.drag-handle:hover {
  color: #c9d1d9;
}

.drag-handle:active {
  cursor: grabbing;
}

.cluster-rumour-details {
  padding: 0.5rem;
  padding-top: 0;
  border-top: 1px solid #30363d;
}

.metadata-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #21262d;
}

.metadata-item {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.metadata-label {
  color: #6e7681;
  font-size: 0.7rem;
  font-weight: 500;
  min-width: 60px;
  flex-shrink: 0;
}

.metadata-value {
  color: #c9d1d9;
  font-size: 0.75rem;
  flex: 1;
}

.status-resolved {
  color: #3fb950 !important;
  font-weight: 500;
}

.status-unresolved {
  color: #f85149 !important;
  font-weight: 500;
}

.details-section {
  color: #8b949e;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.details-section.empty {
  color: #6e7681;
  font-style: italic;
}

/* Accordion transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 1000px; /* Increased to accommodate longer content */
}
</style>
