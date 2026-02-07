import { ref, computed } from 'vue'
import type { Rumour, RumourFilterState } from '@/types/rumour'

/**
 * Filter mode types
 */
export type FilterMode = 'all' | 'resolved' | 'unresolved'

/**
 * Composable for filtering rumours by resolution status and text search
 * Provides filter state management and filtered rumour computation
 * 
 * @param rumours - Reactive array of rumours to filter
 * @returns Filter state and methods
 */
export function useRumourFilter(rumours: { value: Rumour[] }) {
  // Filter mode state (all/resolved/unresolved)
  const filterMode = ref<FilterMode>('all')
  
  // Text search state
  const searchText = ref<string>('')

  /**
   * Set the current filter mode
   * @param mode - The filter mode to apply
   */
  const setFilter = (mode: FilterMode) => {
    filterMode.value = mode
  }

  /**
   * Set the text search filter
   * @param text - The text to search for
   */
  const setSearchText = (text: string) => {
    searchText.value = text
  }

  /**
   * Compute filtered rumours based on current filter mode and text search
   */
  const filteredRumours = computed(() => {
    let filtered = rumours.value

    // Apply resolution status filter
    if (filterMode.value !== 'all') {
      filtered = filtered.filter(rumour => {
        const isResolved = rumour.resolved === true
        
        if (filterMode.value === 'resolved') {
          return isResolved
        } else {
          return !isResolved
        }
      })
    }

    // Apply text search filter
    if (searchText.value.trim()) {
      const searchLower = searchText.value.toLowerCase()
      filtered = filtered.filter(rumour => {
        // Search across title, details, and location fields
        const searchableText = [
          rumour.title,
          rumour.details,
          rumour.location_heard,
          rumour.location_targetted
        ]
          .filter(Boolean) // Remove null/undefined values
          .join(' ')
          .toLowerCase()
        
        return searchableText.includes(searchLower)
      })
    }

    return filtered
  })

  /**
   * Compute filter state with counts
   */
  const filterState = computed<RumourFilterState>(() => {
    const total = rumours.value.length
    
    // Count resolved rumours
    const resolvedCount = rumours.value.filter(rumour => rumour.resolved === true).length
    
    const unresolvedCount = total - resolvedCount

    return {
      currentMode: filterMode.value,
      totalCount: total,
      resolvedCount,
      unresolvedCount
    }
  })

  return {
    filterMode,
    setFilter,
    searchText,
    setSearchText,
    filteredRumours,
    filterState
  }
}
