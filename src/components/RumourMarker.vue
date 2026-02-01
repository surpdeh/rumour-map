<template>
  <div
    ref="markerRef"
    class="rumour-marker"
    :class="{
      'is-pinned': rumour.isPinned,
      'is-unpinned': !rumour.isPinned,
      'is-hovered': rumour.isHovered,
      'is-dragging': rumour.isDragging
    }"
    :style="markerStyle"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove"
    @keydown="handleKeyDown"
    :tabindex="0"
    :aria-label="`Rumour: ${rumour.title}`"
    :aria-expanded="rumour.isHovered"
    role="article"
  >
    <!-- Header with pin icon and title -->
    <div class="marker-header">
      <button
        class="pin-button"
        @click.stop="togglePin"
        :aria-label="rumour.isPinned ? 'Unpin this rumour to move it' : 'Pin this rumour'"
        :title="rumour.isPinned ? 'Click to unpin and drag' : 'Click to pin in place'"
      >
        <span v-if="rumour.isPinned">📍</span>
        <span v-else>⋮⋮</span>
      </button>
      <div class="marker-title">{{ rumour.title }}</div>
    </div>

    <!-- Description (shown on hover or mobile tap) -->
    <transition name="expand">
      <div 
        v-if="rumour.isHovered" 
        class="marker-description"
        :id="`description-${rumour.id}`"
        role="region"
        :aria-label="`Description for ${rumour.title}`"
      >
        <!-- Extended metadata -->
        <div class="marker-metadata">
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
            <span class="metadata-label">Location:</span>
            <span class="metadata-value">{{ rumour.location_targetted }}</span>
          </div>
          
          <div v-if="rumour.rating !== null" class="metadata-item">
            <span class="metadata-label">Rating:</span>
            <span class="metadata-value">{{ formatRating(rumour.rating) }}</span>
          </div>

          <div class="metadata-item">
            <span class="metadata-label">Status:</span>
            <span 
              class="metadata-value status-badge"
              :class="rumour.resolved ? 'status-resolved' : 'status-unresolved'"
            >
              {{ rumour.resolved ? 'Resolved' : 'Unresolved' }}
            </span>
          </div>
        </div>

        <!-- Details/description -->
        <div v-if="rumour.details" class="marker-details">
          {{ rumour.details }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  rumour: {
    type: Object,
    required: true
  },
  mapTransform: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle-pin', 'drag-start'])

const markerRef = ref(null)

// Format helpers
function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

function formatRating(rating) {
  if (rating === null || rating === undefined) return null
  return `${rating}/10`
}

// Calculate screen position from map coordinates
const markerStyle = computed(() => {
  const { scale, translateX, translateY } = props.mapTransform
  const screenX = (props.rumour.x * scale) + translateX
  const screenY = (props.rumour.y * scale) + translateY

  return {
    left: `${screenX}px`,
    top: `${screenY}px`,
    zIndex: props.rumour.isDragging ? 102 : (props.rumour.isHovered ? 101 : 100)
  }
})

const hoverTimeout = ref(null)
const collapseTimeout = ref(null)
const longPressTimeout = ref(null)

const handleMouseEnter = () => {
  // Clear any pending collapse
  if (collapseTimeout.value) {
    clearTimeout(collapseTimeout.value)
    collapseTimeout.value = null
  }
  
  // Delay expansion by 300ms
  hoverTimeout.value = setTimeout(() => {
    props.rumour.isHovered = true
  }, 300)
}

const handleMouseLeave = () => {
  // Clear timeout if mouse leaves before expansion
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
    hoverTimeout.value = null
  }
  
  // Collapse after 200ms delay
  collapseTimeout.value = setTimeout(() => {
    props.rumour.isHovered = false
  }, 200)
}

const togglePin = () => {
  emit('toggle-pin', props.rumour)
}

const handleMouseDown = (e) => {
  if (!props.rumour.isPinned && e.button === 0) {
    emit('drag-start', { rumour: props.rumour, event: e })
  }
}

// Touch handling
const handleTouchStart = (e) => {
  // For pinned rumours, implement long-press to unpin (mobile UX)
  if (props.rumour.isPinned) {
    longPressTimeout.value = setTimeout(() => {
      // Toggle expansion on tap (mobile behavior)
      props.rumour.isHovered = !props.rumour.isHovered
      longPressTimeout.value = null
    }, 150)
  } else {
    // For unpinned rumours, start drag immediately
    emit('drag-start', { rumour: props.rumour, event: e })
  }
}

const handleTouchEnd = (e) => {
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value)
    longPressTimeout.value = null
  }
}

const handleTouchMove = (e) => {
  // Cancel long-press if user starts moving
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value)
    longPressTimeout.value = null
  }
}

// Keyboard navigation
const handleKeyDown = (e) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      // Toggle pin state
      e.preventDefault()
      togglePin()
      break
    case 'Escape':
      // Re-pin if unpinned
      if (!props.rumour.isPinned) {
        props.rumour.isPinned = true
      }
      break
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      // Move unpinned rumours with arrow keys
      if (!props.rumour.isPinned) {
        e.preventDefault()
        const step = 10 // pixels in map coordinates
        
        switch (e.key) {
          case 'ArrowUp':
            props.rumour.y = Math.max(0, props.rumour.y - step)
            break
          case 'ArrowDown':
            props.rumour.y = Math.min(3600, props.rumour.y + step)
            break
          case 'ArrowLeft':
            props.rumour.x = Math.max(0, props.rumour.x - step)
            break
          case 'ArrowRight':
            props.rumour.x = Math.min(6500, props.rumour.x + step)
            break
        }
      }
      break
  }
}

// Cleanup on unmount
onBeforeUnmount(() => {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
  }
  if (collapseTimeout.value) {
    clearTimeout(collapseTimeout.value)
  }
  if (longPressTimeout.value) {
    clearTimeout(longPressTimeout.value)
  }
})
</script>

<style scoped>
.rumour-marker {
  position: absolute;
  background-color: rgba(22, 27, 34, 0.9);
  border: 1px solid #58a6ff;
  border-radius: 6px;
  padding: 0.5rem;
  max-width: 200px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease-out;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  touch-action: none; /* Prevent default touch behaviors */
}

.rumour-marker:focus {
  outline: 2px solid #58a6ff;
  outline-offset: 2px;
}

.rumour-marker.is-pinned {
  cursor: pointer;
  border-color: #58a6ff;
}

.rumour-marker.is-unpinned {
  cursor: grab;
  border-color: #f78166;
}

.rumour-marker.is-dragging {
  cursor: grabbing;
  opacity: 0.8;
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.5);
}

.rumour-marker.is-hovered {
  background-color: rgba(22, 27, 34, 0.95);
  max-width: 300px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.marker-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.marker-title {
  color: #c9d1d9;
  font-size: 0.875rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.marker-description {
  color: #8b949e;
  font-size: 0.75rem;
  line-height: 1.4;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #30363d;
}

.marker-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.metadata-item {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.metadata-label {
  font-weight: 600;
  color: #8b949e;
  flex-shrink: 0;
  min-width: 70px;
}

.metadata-value {
  color: #c9d1d9;
}

.status-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.status-resolved {
  color: #3fb950;
  background-color: rgba(46, 160, 67, 0.15);
}

.status-unresolved {
  color: #e3b341;
  background-color: rgba(187, 128, 9, 0.15);
}

.marker-details {
  color: #8b949e;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #21262d;
  font-size: 0.7rem;
  line-height: 1.5;
}

/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease-out;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 200px;
}

/* Responsive sizing */
@media (max-width: 1023px) {
  .rumour-marker {
    max-width: 180px;
    font-size: 0.875rem;
  }

  .rumour-marker.is-hovered {
    max-width: 250px;
  }
}

@media (max-width: 767px) {
  .rumour-marker {
    max-width: 150px;
    font-size: 0.75rem;
    padding: 0.375rem;
  }

  .rumour-marker.is-hovered {
    max-width: 200px;
  }

  .marker-description {
    font-size: 0.7rem;
  }
}
</style>
