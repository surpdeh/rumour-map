import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useRumourFilter } from '@/composables/useRumourFilter'
import type { Rumour } from '@/types/rumour'

describe('useRumourFilter', () => {
  let sampleRumours: { value: Rumour[] }

  beforeEach(() => {
    sampleRumours = ref([
      {
        id: '1',
        session_date: '2024-01-15',
        game_date: '1372 DR',
        location_heard: 'Waterdeep',
        location_targetted: 'Luskan',
        x: 1000,
        y: 2000,
        title: 'Resolved Rumour 1',
        rating: 8,
        resolved: true,
        details: 'This rumour is resolved',
        isPinned: true,
        isHovered: false,
        isHidden: false,
        isDragging: false
      },
      {
        id: '2',
        session_date: '2024-01-15',
        game_date: '1372 DR',
        location_heard: 'Neverwinter',
        location_targetted: 'Waterdeep',
        x: 1500,
        y: 2500,
        title: 'Unresolved Rumour 1',
        rating: 6,
        resolved: false,
        details: 'This rumour is not resolved',
        isPinned: true,
        isHovered: false,
        isHidden: false,
        isDragging: false
      },
      {
        id: '3',
        session_date: '2024-01-16',
        game_date: '1372 DR',
        location_heard: 'Baldur\'s Gate',
        location_targetted: 'Candlekeep',
        x: 2000,
        y: 3000,
        title: 'Resolved Rumour 2',
        rating: 9,
        resolved: true, // Boolean value
        details: 'Another resolved rumour',
        isPinned: true,
        isHovered: false,
        isHidden: false,
        isDragging: false
      },
      {
        id: '4',
        session_date: '2024-01-16',
        game_date: '1372 DR',
        location_heard: 'Luskan',
        location_targetted: 'Icewind Dale',
        x: 2500,
        y: 3500,
        title: 'False Resolved Rumour',
        rating: 5,
        resolved: false, // False value - should be treated as unresolved
        details: 'Rumour with false resolved status',
        isPinned: true,
        isHovered: false,
        isHidden: false,
        isDragging: false
      }
    ])
  })

  it('initializes with "all" filter mode', () => {
    const { filterMode } = useRumourFilter(sampleRumours)
    
    expect(filterMode.value).toBe('all')
  })

  it('shows all rumours when filter is "all"', () => {
    const { filteredRumours, filterState } = useRumourFilter(sampleRumours)
    
    expect(filteredRumours.value.length).toBe(4)
    expect(filterState.value.totalCount).toBe(4)
  })

  it('filters resolved rumours correctly', () => {
    const { setFilter, filteredRumours, filterState } = useRumourFilter(sampleRumours)
    
    setFilter('resolved')
    
    expect(filteredRumours.value.length).toBe(2)
    expect(filteredRumours.value[0].id).toBe('1')
    expect(filteredRumours.value[1].id).toBe('3')
    expect(filterState.value.resolvedCount).toBe(2)
  })

  it('filters unresolved rumours correctly', () => {
    const { setFilter, filteredRumours, filterState } = useRumourFilter(sampleRumours)
    
    setFilter('unresolved')
    
    expect(filteredRumours.value.length).toBe(2)
    expect(filteredRumours.value[0].id).toBe('2')
    expect(filteredRumours.value[1].id).toBe('4')
    expect(filterState.value.unresolvedCount).toBe(2)
  })

  it('treats false resolved values as unresolved', () => {
    const { setFilter, filteredRumours } = useRumourFilter(sampleRumours)
    
    setFilter('unresolved')
    
    const falseResolvedRumour = filteredRumours.value.find(r => r.id === '4')
    expect(falseResolvedRumour).toBeDefined()
  })

  it('treats boolean true as resolved', () => {
    const { setFilter, filteredRumours } = useRumourFilter(sampleRumours)
    
    setFilter('resolved')
    
    const booleanResolvedRumour = filteredRumours.value.find(r => r.id === '3')
    expect(booleanResolvedRumour).toBeDefined()
  })

  it('provides accurate filter counts', () => {
    const { filterState } = useRumourFilter(sampleRumours)
    
    expect(filterState.value.totalCount).toBe(4)
    expect(filterState.value.resolvedCount).toBe(2)
    expect(filterState.value.unresolvedCount).toBe(2)
  })

  it('updates filtered rumours when filter mode changes', () => {
    const { setFilter, filteredRumours } = useRumourFilter(sampleRumours)
    
    // Start with all
    expect(filteredRumours.value.length).toBe(4)
    
    // Switch to resolved
    setFilter('resolved')
    expect(filteredRumours.value.length).toBe(2)
    
    // Switch to unresolved
    setFilter('unresolved')
    expect(filteredRumours.value.length).toBe(2)
    
    // Back to all
    setFilter('all')
    expect(filteredRumours.value.length).toBe(4)
  })

  it('reacts to changes in rumours array', () => {
    const { filteredRumours } = useRumourFilter(sampleRumours)
    
    // Initial count
    expect(filteredRumours.value.length).toBe(4)
    
    // Add a new rumour
    sampleRumours.value.push({
      id: '5',
      session_date: '2024-01-17',
      game_date: '1372 DR',
      location_heard: 'Mirabar',
      location_targetted: 'Luskan',
      x: 3000,
      y: 4000,
      title: 'New Rumour',
      rating: 7,
      resolved: false,
      details: 'A newly added rumour',
      isPinned: true,
      isHovered: false,
      isHidden: false,
      isDragging: false
    })
    
    // Count should update
    expect(filteredRumours.value.length).toBe(5)
  })

  describe('text search filtering', () => {
    it('initializes with empty search text', () => {
      const { searchText } = useRumourFilter(sampleRumours)
      
      expect(searchText.value).toBe('')
    })

    it('filters by title text (case-insensitive)', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('dragon') // Use a unique search term
      
      // No rumours should match initially
      expect(filteredRumours.value.length).toBe(0)
    })

    it('filters by title text with exact match', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('Resolved Rumour 2')
      
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('3')
    })

    it('filters by title text with different case', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      // All 4 rumours contain "resolved" in some form
      setSearchText('RESOLVED')
      
      expect(filteredRumours.value.length).toBe(4)
    })

    it('filters by details text', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('not resolved')
      
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('2')
    })

    it('filters by location_heard', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      // Both rumour 1 and rumour 2 have "waterdeep" somewhere (1 in location_heard, 2 in location_targetted)
      setSearchText('neverwinter')
      
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('2')
    })

    it('filters by location_targetted', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('candlekeep')
      
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('3')
    })

    it('shows all rumours when search text is empty', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      // All rumours contain "rumour"
      setSearchText('rumour')
      expect(filteredRumours.value.length).toBe(4)
      
      setSearchText('')
      expect(filteredRumours.value.length).toBe(4)
    })

    it('shows all rumours when search text is only whitespace', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('   ')
      
      expect(filteredRumours.value.length).toBe(4)
    })

    it('combines text search with resolution filter', () => {
      const { setSearchText, setFilter, filteredRumours } = useRumourFilter(sampleRumours)
      
      // Filter to only resolved rumours
      setFilter('resolved')
      expect(filteredRumours.value.length).toBe(2)
      
      // Now also filter by text
      setSearchText('rumour 1')
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('1')
    })

    it('combines text search with unresolved filter', () => {
      const { setSearchText, setFilter, filteredRumours } = useRumourFilter(sampleRumours)
      
      // Filter to only unresolved rumours
      setFilter('unresolved')
      expect(filteredRumours.value.length).toBe(2)
      
      // Now also filter by text
      setSearchText('unresolved rumour 1')
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('2')
    })

    it('handles search with no matches', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('nonexistent text xyz')
      
      expect(filteredRumours.value.length).toBe(0)
    })

    it('searches across multiple fields at once', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      // Search for text that appears in location_targetted
      setSearchText('icewind')
      
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('4')
      expect(filteredRumours.value[0].location_targetted).toBe('Icewind Dale')
    })

    it('handles rumours with null details field', () => {
      // Add a rumour with null details
      sampleRumours.value.push({
        id: '5',
        session_date: '2024-01-17',
        game_date: '1372 DR',
        location_heard: 'Mirabar',
        location_targetted: null,
        x: 3000,
        y: 4000,
        title: 'Rumour without details',
        rating: 7,
        resolved: false,
        details: null,
        isPinned: true,
        isHovered: false,
        isHidden: false,
        isDragging: false
      })

      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      setSearchText('without details')
      
      expect(filteredRumours.value.length).toBe(1)
      expect(filteredRumours.value[0].id).toBe('5')
    })

    it('updates results reactively when search text changes', () => {
      const { setSearchText, filteredRumours } = useRumourFilter(sampleRumours)
      
      // All rumours contain "rumour"
      setSearchText('rumour')
      expect(filteredRumours.value.length).toBe(4)
      
      // Only rumour 2 is explicitly "unresolved"
      setSearchText('unresolved')
      expect(filteredRumours.value.length).toBe(1)
      
      // Search for specific location
      setSearchText('baldur')
      expect(filteredRumours.value.length).toBe(1)
    })
  })
})
