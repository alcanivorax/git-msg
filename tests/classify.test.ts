import { describe, it, expect } from 'vitest'
import { detectCommitType } from '../src/logic/classify'

describe('detect Commit Type', () => {
  it('array of files', () => {
    expect([]).toBe([])
  })
  it('single staged files', () => {
    expect([]).toBe([])
  })
})
