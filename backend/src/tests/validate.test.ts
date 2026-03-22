import { describe, it, expect } from 'vitest'
import { sanitizeString, isValidEmail, isValidUUID, validateInt, isOneOf, sanitizeName } from '../utils/validate'

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>Hello')).toBe('alert("xss")Hello')
  })
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello')
  })
  it('returns empty for non-strings', () => {
    expect(sanitizeString(123)).toBe('')
    expect(sanitizeString(null)).toBe('')
    expect(sanitizeString(undefined)).toBe('')
  })
})

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('a.b+c@domain.co.in')).toBe(true)
  })
  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })
  it('rejects overly long emails', () => {
    expect(isValidEmail('a'.repeat(250) + '@b.com')).toBe(false)
  })
})

describe('isValidUUID', () => {
  it('accepts valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })
  it('rejects invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false)
    expect(isValidUUID('')).toBe(false)
    expect(isValidUUID("'; DROP TABLE users;--")).toBe(false)
  })
})

describe('validateInt', () => {
  it('parses and clamps integers', () => {
    expect(validateInt(50, 1, 100, 10)).toBe(50)
    expect(validateInt(200, 1, 100, 10)).toBe(100)
    expect(validateInt(-5, 1, 100, 10)).toBe(1)
  })
  it('returns fallback for invalid input', () => {
    expect(validateInt('abc', 1, 100, 10)).toBe(10)
    expect(validateInt(null, 1, 100, 10)).toBe(10)
  })
})

describe('isOneOf', () => {
  it('returns true for valid values', () => {
    expect(isOneOf('friendly', ['friendly', 'tough'])).toBe(true)
  })
  it('returns false for invalid values', () => {
    expect(isOneOf('evil', ['friendly', 'tough'])).toBe(false)
    expect(isOneOf(123, ['friendly', 'tough'])).toBe(false)
  })
})

describe('sanitizeName', () => {
  it('keeps valid names', () => {
    expect(sanitizeName('Priya Sharma')).toBe('Priya Sharma')
    expect(sanitizeName("O'Brien")).toBe("O'Brien")
  })
  it('strips dangerous characters', () => {
    expect(sanitizeName('<script>alert(1)</script>')).toBe('scriptalertscript')
    expect(sanitizeName('John; DROP TABLE--')).toBe('John DROP TABLE--')
  })
  it('truncates long names', () => {
    expect(sanitizeName('A'.repeat(200)).length).toBe(100)
  })
})
