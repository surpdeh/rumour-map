<template>
  <div class="rumour-overlay">
    <!-- Loading state -->
    <div v-if="isLoading" class="overlay-message">
      <span class="Label Label--primary">Loading rumours...</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="overlay-message error">
      <span class="Label Label--danger">Failed to load rumours: {{ error }}</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="rumours.length === 0" class="overlay-message">
      <span class="Label Label--secondary">No rumours available</span>
    </div>

    <!-- Rumour markers -->
    <RumourMarker
      v-for="rumour in visibleRumours"
      :key="rumour.id"
      :rumour="rumour"
      :map-transform="mapTransform"
      @toggle-pin="handleTogglePin"
      @drag-start="handleDragStart"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRumours } from '../composables/useRumours'
import RumourMarker from './RumourMarker.vue'

const props = defineProps({
  mapTransform: {
    type: Object,
    required: true,
    default: () => ({
      scale: 1,
      translateX: 0,
      translateY: 0
    })
  }
})

const { rumours, isLoading, error } = useRumours()

// Filter out hidden rumours
const visibleRumours = computed(() => {
  return rumours.value.filter(rumour => !rumour.isHidden)
})

const handleTogglePin = (rumour) => {
  rumour.isPinned = !rumour.isPinned
}

let dragState = null

const handleDragStart = ({ rumour, event }) => {
  if (rumour.isPinned) return

  rumour.isDragging = true
  
  const startX = event.clientX
  const startY = event.clientY
  const initialMapX = rumour.x
  const initialMapY = rumour.y

  const onMove = (e) => {
    // Calculate delta in screen space, then convert to map space
    const dx = (e.clientX - startX) / props.mapTransform.scale
    const dy = (e.clientY - startY) / props.mapTransform.scale

    // Update position, clamping to map bounds
    rumour.x = Math.max(0, Math.min(6500, initialMapX + dx))
    rumour.y = Math.max(0, Math.min(3600, initialMapY + dy))
  }

  const onEnd = () => {
    rumour.isDragging = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    dragState = null
  }

  dragState = { rumour, onMove, onEnd }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  
  event.preventDefault()
}
</script>

<style scoped>
.rumour-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.overlay-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: auto;
}

.overlay-message.error .Label {
  background-color: #da3633;
}
</style>
