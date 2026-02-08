import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HarptosDateInput from '@/components/HarptosDateInput.vue'

describe('HarptosDateInput', () => {
  it('renders with placeholder when no value', () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null,
        placeholder: 'Select date...'
      }
    })
    
    expect(wrapper.find('.date-display').exists()).toBe(true)
    expect(wrapper.text()).toContain('Select date...')
  })

  it('displays the current value', () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: '15 Hammer, 1492 DR'
      }
    })
    
    expect(wrapper.text()).toContain('15 Hammer, 1492 DR')
  })

  it('opens picker overlay when clicked', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null
      },
      attachTo: document.body
    })
    
    // Initially, picker should not be shown
    expect(wrapper.find('.date-picker-overlay').exists()).toBe(false)
    
    // Click the display
    await wrapper.find('.date-display').trigger('click')
    await wrapper.vm.$nextTick()
    
    // Picker should now be shown
    expect(wrapper.vm.showPicker).toBe(true)
    
    wrapper.unmount()
  })

  it('opens picker on Enter key', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null
      }
    })
    
    await wrapper.find('.date-display').trigger('keydown.enter')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.showPicker).toBe(true)
  })

  it('opens picker on Space key', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null
      }
    })
    
    await wrapper.find('.date-display').trigger('keydown.space')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.showPicker).toBe(true)
  })

  it('emits update:modelValue when date changes', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null
      }
    })
    
    // Trigger the handleDateChange method directly
    await wrapper.vm.handleDateChange('15 Hammer, 1492 DR')
    
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['15 Hammer, 1492 DR'])
  })

  it('clears date when clear button is clicked', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: '15 Hammer, 1492 DR'
      }
    })
    
    // Call clearDate method
    await wrapper.vm.clearDate()
    
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([null])
  })

  it('closes picker when closePicker is called', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null
      }
    })
    
    // Open picker
    wrapper.vm.showPicker = true
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.showPicker).toBe(true)
    
    // Close picker
    await wrapper.vm.closePicker()
    expect(wrapper.vm.showPicker).toBe(false)
  })

  it('updates localValue when modelValue prop changes', async () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: '15 Hammer, 1492 DR'
      }
    })
    
    expect(wrapper.vm.localValue).toBe('15 Hammer, 1492 DR')
    
    // Update prop
    await wrapper.setProps({ modelValue: '21 Flamerule, 1492 DR' })
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.localValue).toBe('21 Flamerule, 1492 DR')
  })

  it('shows calendar icon', () => {
    const wrapper = mount(HarptosDateInput, {
      props: {
        modelValue: null
      }
    })
    
    expect(wrapper.find('.calendar-icon').exists()).toBe(true)
    expect(wrapper.find('.calendar-icon').text()).toBe('📅')
  })

  it('applies correct CSS classes based on value state', () => {
    const wrapperEmpty = mount(HarptosDateInput, {
      props: {
        modelValue: null
      }
    })
    
    expect(wrapperEmpty.find('.date-display').classes()).toContain('placeholder')
    expect(wrapperEmpty.find('.date-display').classes()).not.toContain('has-value')
    
    const wrapperWithValue = mount(HarptosDateInput, {
      props: {
        modelValue: '15 Hammer, 1492 DR'
      }
    })
    
    expect(wrapperWithValue.find('.date-display').classes()).toContain('has-value')
    expect(wrapperWithValue.find('.date-display').classes()).not.toContain('placeholder')
  })
})
