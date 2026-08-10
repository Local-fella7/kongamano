import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '../../app/components/common/AppButton.vue'

describe('AppButton Component Tests', () => {
  it('1. renders slot text properly', () => {
    const wrapper = mount(AppButton, {
      slots: { default: 'Click Me' }
    })
    expect(wrapper.text()).toBe('Click Me')
  })

  it('2. defaults to btn-primary class', () => {
    const wrapper = mount(AppButton)
    expect(wrapper.classes()).toContain('btn-primary')
  })

  it('3. applies variant secondary class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'secondary' } })
    expect(wrapper.classes()).toContain('btn-secondary')
  })

  it('4. applies variant dark class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'dark' } })
    expect(wrapper.classes()).toContain('btn-dark')
  })

  it('5. sets disabled attribute when loading is true', () => {
    const wrapper = mount(AppButton, { props: { loading: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('6. does not set disabled attribute when loading is false', () => {
    const wrapper = mount(AppButton, { props: { loading: false } })
    expect(wrapper.attributes('disabled')).toBeUndefined()
  })
})
