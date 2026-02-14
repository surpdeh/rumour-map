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
    @click="toggleExpand"
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
        <div class="cluster-rumour-header">
          <!-- Pin/Unpin button -->
          <button
            class="pin-button"
            @click.stop="handleTogglePin(rumour)"
            @mousedown.stop
            :aria-label="rumour.isPinned ? 'Unpin this rumour' : 'Pin this rumour'"
            :title="rumour.isPinned ? 'Click to unpin' : 'Click to pin in place'"
          >
            <span v-if="rumour.is_a_place && rumour.isPinned">⌘</span>
            <span v-else-if="rumour.is_a_place && !rumour.isPinned">🔀</span>
            <span v-else-if="rumour.isPinned">📍</span>
            <span v-else>🔀</span>
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
          
          <!-- Drag handle (always shown) -->
          <span
            class="drag-handle"
            @mousedown.stop="handleDragStart(rumour, $event)"
            @touchstart.stop="handleDragStart(rumour, $event)"
            aria-label="Drag to move rumour"
            title="Drag to move"
          >
            ⋮⋮
          </span>
        </div>

        <!-- Accordion content: rumour details -->
        <transition name="accordion">
          <div v-if="expandedRumourId === rumour.id" class="cluster-rumour-details">
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
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ClusteredRumour, MapTransform } from '../composables/useRumourClustering'

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

const handleRumourClick = (rumour: any) => {
  // Toggle accordion: expand/collapse individual rumour
  if (expandedRumourId.value === rumour.id) {
    expandedRumourId.value = null
  } else {
    expandedRumourId.value = rumour.id
  }
}

const handleTogglePin = (rumour: any) => {
  emit('toggle-pin', rumour)
}

const handleDragStart = (rumour: any, event: MouseEvent | TouchEvent) => {
  // Allow dragging regardless of pinned state
  emit('drag-start', { rumour, event })
}

const handleEdit = (rumour: any) => {
  // Set the rumour as hovered to trigger edit mode in RumourMarker
  // This is a temporary solution - ideally we'd handle editing directly in cluster
  rumour.isHovered = true
  // Note: Full edit functionality would require expanding this component
  // For now, this allows the rumour to be edited via its own marker
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
