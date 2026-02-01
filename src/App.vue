<script setup lang="ts">
import { computed } from "vue";
import PanZoomMap from "./components/PanZoomMap.vue";
import GoogleAuthButton from "./components/GoogleAuthButton.vue";
import RumourFilter from "./components/RumourFilter.vue";
import { useRumoursFromGoogle } from "./composables/useRumoursFromGoogle";
import { useRumourFilter } from "./composables/useRumourFilter";

const { rumours, isLoading, error, refreshRumours } = useRumoursFromGoogle();
const { filterState, filteredRumours, setFilter } = useRumourFilter(rumours);

// Filter out hidden rumours from the filtered set
const visibleRumours = computed(() => {
  return filteredRumours.value.filter((rumour) => !rumour.isHidden);
});

const mapImageUrl =
  "https://forum.sablewyvern.com/Image/the_savage_frontier_by_yora_player_map_v2.png";
</script>

<template>
  <div class="app-container">
    <header class="Header">
      <div class="Header-item">
        <h1 class="Header-title">Rumour Map</h1>
      </div>
      
      <div class="Header-item">
        <GoogleAuthButton />
      </div>

      <div class="Header-item Header-item--full"></div>

      <div v-if="isLoading" class="Header-item">
        <span class="Label Label--primary">Loading rumours...</span>
      </div>

      <div v-else-if="error" class="Header-item error">
        <span class="Label Label--danger">{{ error }}</span>
      </div>

      <div v-else-if="rumours.length === 0" class="Header-item">
        <span class="Label Label--secondary">No rumours available</span>
      </div>

      <div v-if="rumours.length > 0" class="Header-item">
        <RumourFilter 
          :filter-state="filterState" 
          @update:filter="setFilter"
        />
      </div>

      <div class="Header-item">
        <button 
          @click="refreshRumours" 
          class="refresh-btn"
          :disabled="isLoading"
          title="Refresh rumours from Google Sheets"
        >
          <span v-if="!isLoading">🔄</span>
          <span v-else>⏳</span>
          Refresh
        </button>
      </div>
    </header>

    <main class="main-content">
      <PanZoomMap :image-url="mapImageUrl" :rumours="visibleRumours" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0d1117;
}

.Header {
  background-color: #161b22;
  border-bottom: 1px solid #30363d;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.Header-item {
  display: flex;
  align-items: center;
}

.Header-item--full {
  flex: 1;
  min-width: 20px;
}

.Header-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #c9d1d9;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #c9d1d9;
  background-color: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #30363d;
  border-color: #8b949e;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

@media (max-width: 1023px) {
  .Header {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .Header-title {
    font-size: 1rem;
  }
}

@media (max-width: 767px) {
  .Header {
    flex-direction: column;
    align-items: stretch;
  }

  .Header-item {
    width: 100%;
    justify-content: center;
  }

  .Header-item--full {
    display: none;
  }
}
</style>
