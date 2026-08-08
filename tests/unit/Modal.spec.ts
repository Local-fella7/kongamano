import { describe, it, expect } from 'vitest'
import { computed } from 'vue'

describe('Modal component logic & properties', () => {
  function getVariantClass(variant: string = 'primary') {
    return variant === 'danger' ? 'modal-header-danger' : 'modal-header-gradient'
  }

  function getMaxWidthClass(size: string = 'md') {
    if (size === 'sm') return 'modal-box--sm'
    if (size === 'lg') return 'modal-box--lg'
    return 'modal-box--md'
  }

  it('1. computes default variant header class', () => {
    expect(getVariantClass()).toBe('modal-header-gradient')
  })

  it('2. computes danger variant header class', () => {
    expect(getVariantClass('danger')).toBe('modal-header-danger')
  })

  it('3. computes sm max width class', () => {
    expect(getMaxWidthClass('sm')).toBe('modal-box--sm')
  })

  it('4. computes md max width class', () => {
    expect(getMaxWidthClass('md')).toBe('modal-box--md')
  })

  it('5. computes lg max width class', () => {
    expect(getMaxWidthClass('lg')).toBe('modal-box--lg')
  })
})
