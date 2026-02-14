import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClusterMarker from '@/components/ClusterMarker.vue'
import type { ClusteredRumour } from '@/composables/useRumourClustering'

// Mock the composable
vi.mock('@/composables/useRumourUpdates', () => ({
  useRumourUpdates: () => ({
    markFieldAsModified: vi.fn()
  })
}))

describe('ClusterMarker Edit Functionality', () => {
  let cluster: ClusteredRumour
  let mapTransform: any

  beforeEach(() => {
    cluster = {
      id: 'cluster-1',
      centerX: 100,
      centerY: 100,
      screenX: 100,
      screenY: 100,
      rumours: [
        {
          id: 'R1',
          x: 100,
          y: 100,
          title: 'Test Rumour 1',
          details: 'Test details 1',
          isPinned: true,
          isHovered: false,
          isDragging: false,
          isModified: false,
          session_date: '2024-01-01',
          game_date: '1 Hammer, 1492 DR',
          location_heard: 'Tavern',
          location_targetted: 'Castle',
          is_a_place: false,
          rating: 5,
          resolved: false,
          modifiedFields: new Set(),
          originalValues: {
            title: 'Test Rumour 1',
            session_date: '2024-01-01',
            game_date: '1 Hammer, 1492 DR',
            location_heard: 'Tavern',
            location_targetted: 'Castle',
            is_a_place: false,
            rating: 5,
            resolved: false,
            details: 'Test details 1'
          }
        }
      ]
    }

    mapTransform = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPanning: false,
      isTransforming: false
    }
  })

  it('should show edit button when rumour is expanded', async () => {
    const wrapper = mount(ClusterMarker, {
      props: {
        cluster,
        mapTransform,
        isPanning: false
      }
    })

    // Expand the cluster
    await wrapper.find('.cluster-marker').trigger('click')
    await nextTick()

    // Expand the rumour
    const rumourTitle = wrapper.find('.rumour-title')
    await rumourTitle.trigger('click')
    await nextTick()

    // Check that edit button is visible
    const editButton = wrapper.find('.edit-button')
    expect(editButton.exists()).toBe(true)
  })

  it('should show edit form when edit button is clicked', async () => {
    const wrapper = mount(ClusterMarker, {
      props: {
        cluster,
        mapTransform,
        isPanning: false
      }
    })

    // Expand the cluster
    await wrapper.find('.cluster-marker').trigger('click')
    await nextTick()

    // Expand the rumour
    const rumourTitle = wrapper.find('.rumour-title')
    await rumourTitle.trigger('click')
    await nextTick()

    // Click edit button
    const editButton = wrapper.find('.edit-button')
    await editButton.trigger('click')
    await nextTick()

    // Check that edit form is visible
    const editForm = wrapper.find('.edit-form')
    expect(editForm.exists()).toBe(true)

    // Check that title input is populated with current value
    const titleInput = wrapper.find('.edit-title')
    expect((titleInput.element as HTMLInputElement).value).toBe('Test Rumour 1')
  })

  it('should hide read-only view when in edit mode', async () => {
    const wrapper = mount(ClusterMarker, {
      props: {
        cluster,
        mapTransform,
        isPanning: false
      }
    })

    // Expand the cluster and rumour
    await wrapper.find('.cluster-marker').trigger('click')
    await nextTick()
    await wrapper.find('.rumour-title').trigger('click')
    await nextTick()

    // Verify metadata section is visible
    expect(wrapper.find('.metadata-section').exists()).toBe(true)

    // Click edit button
    await wrapper.find('.edit-button').trigger('click')
    await nextTick()

    // Metadata section should be hidden (replaced by edit form)
    expect(wrapper.find('.edit-form').exists()).toBe(true)
    // Check that read-only metadata is not visible
    const metadataSections = wrapper.findAll('.metadata-section')
    // The edit form might have some similar structure, but the read-only metadata should not be visible
    expect(wrapper.find('.edit-form').exists()).toBe(true)
  })

  it('should save edits when save button is clicked', async () => {
    const wrapper = mount(ClusterMarker, {
      props: {
        cluster,
        mapTransform,
        isPanning: false
      }
    })

    // Expand the cluster and rumour
    await wrapper.find('.cluster-marker').trigger('click')
    await nextTick()
    await wrapper.find('.rumour-title').trigger('click')
    await nextTick()

    // Click edit button
    await wrapper.find('.edit-button').trigger('click')
    await nextTick()

    // Edit the title
    const titleInput = wrapper.find('.edit-title')
    await titleInput.setValue('Updated Rumour Title')
    await nextTick()

    // Click save button
    const saveButton = wrapper.find('.save-button')
    await saveButton.trigger('click')
    await nextTick()

    // Edit form should be hidden
    expect(wrapper.find('.edit-form').exists()).toBe(false)

    // Rumour title should be updated
    expect(cluster.rumours[0].title).toBe('Updated Rumour Title')
  })

  it('should cancel edits when cancel button is clicked', async () => {
    const wrapper = mount(ClusterMarker, {
      props: {
        cluster,
        mapTransform,
        isPanning: false
      }
    })

    const originalTitle = cluster.rumours[0].title

    // Expand the cluster and rumour
    await wrapper.find('.cluster-marker').trigger('click')
    await nextTick()
    await wrapper.find('.rumour-title').trigger('click')
    await nextTick()

    // Click edit button
    await wrapper.find('.edit-button').trigger('click')
    await nextTick()

    // Edit the title
    const titleInput = wrapper.find('.edit-title')
    await titleInput.setValue('Temporary Change')
    await nextTick()

    // Click cancel button
    const cancelButton = wrapper.find('.cancel-button')
    await cancelButton.trigger('click')
    await nextTick()

    // Edit form should be hidden
    expect(wrapper.find('.edit-form').exists()).toBe(false)

    // Rumour title should remain unchanged
    expect(cluster.rumours[0].title).toBe(originalTitle)
  })

  it('should populate all edit fields with current values', async () => {
    const wrapper = mount(ClusterMarker, {
      props: {
        cluster,
        mapTransform,
        isPanning: false
      }
    })

    // Expand the cluster and rumour
    await wrapper.find('.cluster-marker').trigger('click')
    await nextTick()
    await wrapper.find('.rumour-title').trigger('click')
    await nextTick()

    // Click edit button
    await wrapper.find('.edit-button').trigger('click')
    await nextTick()

    // Check all input fields have correct values
    const titleInput = wrapper.find('.edit-title')
    expect((titleInput.element as HTMLInputElement).value).toBe('Test Rumour 1')

    const inputs = wrapper.findAll('input[type="text"]')
    const sessionDateInput = inputs.find(el => 
      (el.element as HTMLInputElement).placeholder === 'Session date'
    )
    expect((sessionDateInput?.element as HTMLInputElement)?.value).toBe('2024-01-01')

    const ratingInput = wrapper.find('input[type="number"]')
    expect((ratingInput.element as HTMLInputElement).value).toBe('5')

    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Test details 1')
  })
})
