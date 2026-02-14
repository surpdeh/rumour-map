import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PanZoomMap from '../../src/components/PanZoomMap.vue';

describe('PanZoomMap - Double Click Zoom', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = mount(PanZoomMap, {
      props: {
        rumours: [],
        imageUrl: '/test-image.jpg',
      },
    });
  });

  it('should increase zoom by 40% on double-click', async () => {
    const content = wrapper.find('.pan-zoom-content');
    const initialScale = wrapper.vm.scale;

    // Simulate double-click event
    const dblClickEvent = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      clientX: 300,
      clientY: 200,
    });

    // Mock getBoundingClientRect for the container
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
    }));

    wrapper.vm.container = {
      getBoundingClientRect: mockGetBoundingClientRect,
    };

    // Trigger double-click
    await content.element.dispatchEvent(dblClickEvent);
    await wrapper.vm.$nextTick();

    // Check that scale increased by approximately 40% (factor 1.4)
    const expectedScale = initialScale * 1.4;
    expect(wrapper.vm.scale).toBeCloseTo(expectedScale, 5);
  });

  it('should zoom toward the double-click location', async () => {
    const content = wrapper.find('.pan-zoom-content');
    const initialTranslateX = wrapper.vm.translateX;
    const initialTranslateY = wrapper.vm.translateY;
    const initialScale = wrapper.vm.scale;

    // Simulate double-click event at a specific location
    const clickX = 400;
    const clickY = 300;
    const dblClickEvent = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      clientX: clickX,
      clientY: clickY,
    });

    // Mock getBoundingClientRect for the container
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
    }));

    wrapper.vm.container = {
      getBoundingClientRect: mockGetBoundingClientRect,
    };

    // Trigger double-click
    await content.element.dispatchEvent(dblClickEvent);
    await wrapper.vm.$nextTick();

    // Translation should have changed (zooming toward the click point)
    const translateXChanged = wrapper.vm.translateX !== initialTranslateX;
    const translateYChanged = wrapper.vm.translateY !== initialTranslateY;
    
    // At least one axis should have changed translation (unless we clicked exactly at the current origin)
    expect(translateXChanged || translateYChanged).toBe(true);
  });

  it('should respect max zoom limit on double-click', async () => {
    const maxScale = 2.0;
    wrapper = mount(PanZoomMap, {
      props: {
        rumours: [],
        imageUrl: '/test-image.jpg',
        maxScale: maxScale,
      },
    });

    const content = wrapper.find('.pan-zoom-content');
    
    // Mock getBoundingClientRect
    const mockGetBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
    }));

    wrapper.vm.container = {
      getBoundingClientRect: mockGetBoundingClientRect,
    };

    // Set scale close to max
    wrapper.vm.scale = 1.8;

    const dblClickEvent = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      clientX: 300,
      clientY: 200,
    });

    // Trigger double-click
    await content.element.dispatchEvent(dblClickEvent);
    await wrapper.vm.$nextTick();

    // Scale should be clamped to maxScale
    expect(wrapper.vm.scale).toBeLessThanOrEqual(maxScale);
  });
});
