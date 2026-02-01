import { ref, computed, type Ref } from 'vue'
import type { Rumour, RumourFilterState, UseRumourFilterReturn } from '../types/rumour'

export function useRumourFilter(rumours: Ref<Rumour[]>): UseRumourFilterReturn {
  const filterState = ref<RumourFilterState>({
    filterMode: 'all',
    totalCount: 0,
    resolvedCount: 0,
    unresolvedCount: 0
  })

  const filteredRumours = computed(() => {
    const allRumours = rumours.value || []
    
    // Update counts
    filterState.value.totalCount = allRumours.length
    filterState.value.resolvedCount = allRumours.filter(r => r.resolved).length
    filterState.value.unresolvedCount = allRumours.filter(r => !r.resolved).length

    // Apply filter
    switch (filterState.value.filterMode) {
      case 'resolved':
        return allRumours.filter(r => r.resolved)
      case 'unresolved':
        return allRumours.filter(r => !r.resolved)
      case 'all':
      default:
        return allRumours
    }
  })

  function setFilter(mode: 'all' | 'resolved' | 'unresolved'): void {
    filterState.value.filterMode = mode
  }

  return {
    filterState,
    filteredRumours,
    setFilter
  }
}
