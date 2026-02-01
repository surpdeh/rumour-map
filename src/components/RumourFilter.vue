<template>
  <div class="rumour-filter">
    <div class="filter-buttons">
      <button
        @click="setFilter('all')"
        class="filter-btn"
        :class="{ active: filterState.filterMode === 'all' }"
        :title="`Show all ${filterState.totalCount} rumours`"
      >
        All
        <span class="badge">{{ filterState.totalCount }}</span>
      </button>
      
      <button
        @click="setFilter('unresolved')"
        class="filter-btn"
        :class="{ active: filterState.filterMode === 'unresolved' }"
        :title="`Show ${filterState.unresolvedCount} unresolved rumours`"
      >
        Unresolved
        <span class="badge badge-warning">{{ filterState.unresolvedCount }}</span>
      </button>
      
      <button
        @click="setFilter('resolved')"
        class="filter-btn"
        :class="{ active: filterState.filterMode === 'resolved' }"
        :title="`Show ${filterState.resolvedCount} resolved rumours`"
      >
        Resolved
        <span class="badge badge-success">{{ filterState.resolvedCount }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RumourFilterState } from '../types/rumour'

const props = defineProps<{
  filterState: RumourFilterState
}>()

const emit = defineEmits<{
  (e: 'update:filter', mode: 'all' | 'resolved' | 'unresolved'): void
}>()

function setFilter(mode: 'all' | 'resolved' | 'unresolved') {
  emit('update:filter', mode)
}
</script>

<style scoped>
.rumour-filter {
  display: flex;
  align-items: center;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  background-color: #161b22;
  border-radius: 6px;
  padding: 0.25rem;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #8b949e;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-btn:hover {
  color: #c9d1d9;
  background-color: #21262d;
}

.filter-btn.active {
  color: #fff;
  background-color: #30363d;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 0.125rem 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  color: #c9d1d9;
  background-color: #21262d;
  border-radius: 12px;
}

.badge-warning {
  color: #e3b341;
  background-color: rgba(187, 128, 9, 0.15);
}

.badge-success {
  color: #3fb950;
  background-color: rgba(46, 160, 67, 0.15);
}

.filter-btn.active .badge {
  background-color: #21262d;
  color: #fff;
}

@media (max-width: 767px) {
  .filter-buttons {
    gap: 0.25rem;
  }

  .filter-btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .badge {
    font-size: 0.625rem;
    min-width: 18px;
    padding: 0.125rem 0.25rem;
  }
}
</style>
