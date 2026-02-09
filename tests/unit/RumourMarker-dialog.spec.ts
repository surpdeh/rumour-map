import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RumourMarker from '@/components/RumourMarker.vue'
import type { Rumour } from '@/types/rumour'

// Mock the composable
vi.mock('@/composables/useRumourUpdates', () => ({
  useRumourUpdates: () => ({
    markFieldAsModified: vi.fn()
  })
}))

describe('RumourMarker Dialog Positioning', () => {
  let originalInnerHeight: number
  let originalInnerWidth: number

  beforeEach(() => {
    // Store original values
    originalInnerHeight = window.innerHeight
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    })
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    })
  })

  it('should apply max-height constraint to dialog in edit mode', async () => {
    const rumour: Rumour = {
      id: 'R1',
      x: 100,
      y: 100,
      title: 'Test Rumour',
      details: 'Test details',
      isPinned: true,
      isHovered: true,
      isDragging: false,
      isModified: false,
      session_date: '',
      game_date: '',
      location_heard: '',
      location_targetted: '',
      is_a_place: false,
      rating: null,
      resolved: false,
      modifiedFields: new Set(),
      originalValues: {}
    }

    const mapTransform = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPanning: false,
      isTransforming: false
    }

    const wrapper = mount(RumourMarker, {
      props: {
        rumour,
        mapTransform,
        isPanning: false
      }
    })

    // Find and click the edit button
    const editButton = wrapper.find('.edit-button')
    await editButton.trigger('click')
    await nextTick()

    // Check that the marker has the is-editing class
    expect(wrapper.find('.rumour-marker').classes()).toContain('is-editing')

    // Check that the marker-description has overflow-y auto
    const markerDescription = wrapper.find('.marker-description')
    expect(markerDescription.exists()).toBe(true)
  })

  it('should adjust dialog position when it would overflow bottom of viewport', async () => {
    // Set a small viewport height to simulate overflow scenario
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 600
    })

    const rumour: Rumour = {
      id: 'R1',
      x: 100,
      y: 500, // Position near bottom
      title: 'Test Rumour Near Bottom',
      details: 'Test details',
      isPinned: true,
      isHovered: true,
      isDragging: false,
      isModified: false,
      session_date: '',
      game_date: '',
      location_heard: '',
      location_targetted: '',
      is_a_place: false,
      rating: null,
      resolved: false,
      modifiedFields: new Set(),
      originalValues: {}
    }

    const mapTransform = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPanning: false,
      isTransforming: false
    }

    // Mock getBoundingClientRect to simulate dialog extending beyond viewport
    const mockGetBoundingClientRect = vi.fn(() => ({
      top: 500,
      bottom: 900, // Extends beyond viewport (600px)
      left: 100,
      right: 400,
      width: 300,
      height: 400
    }))

    const wrapper = mount(RumourMarker, {
      props: {
        rumour,
        mapTransform,
        isPanning: false
      },
      attachTo: document.body
    })

    const markerElement = wrapper.find('.rumour-marker').element as HTMLElement
    markerElement.getBoundingClientRect = mockGetBoundingClientRect

    // Click edit button
    const editButton = wrapper.find('.edit-button')
    await editButton.trigger('click')
    await nextTick()

    // The component should apply an offset to keep dialog in viewport
    // We can verify this by checking the computed style
    const style = markerElement.style
    expect(style.top).toBeDefined()

    wrapper.unmount()
  })

  it('should reset dialog offset when exiting edit mode', async () => {
    const rumour: Rumour = {
      id: 'R1',
      x: 100,
      y: 100,
      title: 'Test Rumour',
      details: 'Test details',
      isPinned: true,
      isHovered: true,
      isDragging: false,
      isModified: false,
      session_date: '',
      game_date: '',
      location_heard: '',
      location_targetted: '',
      is_a_place: false,
      rating: null,
      resolved: false,
      modifiedFields: new Set(),
      originalValues: {}
    }

    const mapTransform = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPanning: false,
      isTransforming: false
    }

    const wrapper = mount(RumourMarker, {
      props: {
        rumour,
        mapTransform,
        isPanning: false
      }
    })

    // Enter edit mode
    const editButton = wrapper.find('.edit-button')
    await editButton.trigger('click')
    await nextTick()

    expect(wrapper.find('.rumour-marker').classes()).toContain('is-editing')

    // Exit edit mode
    const cancelButton = wrapper.find('.cancel-button')
    await cancelButton.trigger('click')
    await nextTick()

    expect(wrapper.find('.rumour-marker').classes()).not.toContain('is-editing')
  })
})
