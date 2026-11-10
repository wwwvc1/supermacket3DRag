import { describe, expect, it } from 'vitest'
import { formatDateTime, formatFileSize, radToDeg } from './format'

describe('format 工具', () => {
  it('formatFileSize', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatFileSize(null)).toBe('-')
  })
  it('formatDateTime', () => {
    expect(formatDateTime('2026-11-10T14:07:16.123')).toBe('2026-11-10 14:07:16')
    expect(formatDateTime([2026, 1, 2, 3, 4, 5])).toBe('2026-01-02 03:04:05')
    expect(formatDateTime(null)).toBe('-')
  })
  it('radToDeg', () => {
    expect(radToDeg(Math.PI)).toBe('180.0')
    expect(radToDeg(undefined)).toBe('-')
  })
})
