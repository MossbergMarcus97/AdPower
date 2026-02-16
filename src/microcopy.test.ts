import { afterEach, describe, expect, it, vi } from 'vitest'
import { getGreeting, getLoadingMessage } from './microcopy'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('microcopy', () => {
  it('returns greeting that includes user name', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const message = getGreeting('Marcus', new Date('2026-02-16T09:00:00.000Z'))
    expect(message).toContain('Marcus')
  })

  it('returns short loading copy for short durations', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getLoadingMessage(2)).toBe('Cooking up magic...')
  })

  it('returns medium loading copy for medium durations', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getLoadingMessage(8)).toBe('Consulting the creative gods...')
  })

  it('returns long loading copy for long durations', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(getLoadingMessage(20)).toContain('taking a moment')
  })
})
