import { ref, computed, type Ref } from 'vue'
import type { Rumour, RumourFilterState, UseRumourFilterReturn } from '../types/rumour'

export function useRumourFilter(rumours: Ref<Rumour[]>): UseRumourFilterReturn {
  const filterState = ref<RumourFilterState>({
    filterMode: 'all',
    totalCount: 0,
    resolvedCount: 0,
    unresolvedCount: 0
  })

  // Separate computed for counts to avoid recalculating on every filter change
  const counts = computed(() => {
    const allRumours = rumours.value || []
    return {
      total: allRumours.length,
      resolved: allRumours.filter(r => r.resolved).length,
      unresolved: allRumours.filter(r => !r.resolved).length
    }
  })

  const filteredRumours = computed(() => {
    const allRumours = rumours.value || []
    
    // Update counts from memoized computation
    const { total, resolved, unresolved } = counts.value
    filterState.value.totalCount = total
    filterState.value.resolvedCount = resolved
    filterState.value.unresolvedCount = unresolved

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
