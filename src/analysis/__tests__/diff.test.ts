import { describe, it, expect } from 'vitest'
import { analyzeDiff } from '../diff.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wraps diff lines in a minimal valid diff header so the parser sees them. */
function makeDiff(lines: string[]): string {
  return [
    'diff --git a/file.ts b/file.ts',
    'index abc123..def456 100644',
    '--- a/file.ts',
    '+++ b/file.ts',
    '@@ -1,4 +1,4 @@',
    ...lines,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Empty / no-op input
// ---------------------------------------------------------------------------

describe('analyzeDiff — empty input', () => {
  it('returns empty signals for an empty string', () => {
    const result = analyzeDiff('')
    expect(result.addedSymbols).toEqual([])
    expect(result.removedSymbols).toEqual([])
    expect(result.hasFixPattern).toBe(false)
    expect(result.hasTestPattern).toBe(false)
    expect(result.netLines).toBe(0)
    expect(result.addedPackages).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Symbol extraction — TypeScript / JavaScript
// ---------------------------------------------------------------------------

describe('analyzeDiff — TS/JS symbol extraction', () => {
  it('detects an added regular function', () => {
    const diff = makeDiff(['+function greetUser() {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('greetUser')
  })

  it('detects an added async function', () => {
    const diff = makeDiff(['+async function fetchUserData() {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('fetchUserData')
  })

  it('detects an added exported function', () => {
    const diff = makeDiff(['+export function validateEmail(email: string) {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('validateEmail')
  })

  it('detects an added exported async function', () => {
    const diff = makeDiff(['+export async function buildPayload() {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('buildPayload')
  })

  it('detects an added const arrow function', () => {
    const diff = makeDiff(['+const handleRequest = async (req) => {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('handleRequest')
  })

  it('detects an added exported const arrow function', () => {
    const diff = makeDiff(['+export const parseConfig = (raw: string) => {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('parseConfig')
  })

  it('detects an added class', () => {
    const diff = makeDiff(['+class UserAuthService {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('UserAuthService')
  })

  it('detects an added exported abstract class', () => {
    const diff = makeDiff(['+export abstract class BaseRepository {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('BaseRepository')
  })

  it('detects an added interface', () => {
    const diff = makeDiff(['+export interface UserProfile {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('UserProfile')
  })

  it('detects an added type alias', () => {
    const diff = makeDiff(['+export type CommitSignals = {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('CommitSignals')
  })

  it('detects an added enum', () => {
    const diff = makeDiff(['+export enum FileStatus {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('FileStatus')
  })

  it('places added symbols in addedSymbols, not removedSymbols', () => {
    const diff = makeDiff(['+function newFn() {}'])
    const result = analyzeDiff(diff)
    expect(result.addedSymbols).toContain('newFn')
    expect(result.removedSymbols).not.toContain('newFn')
  })

  it('places removed symbols in removedSymbols, not addedSymbols', () => {
    const diff = makeDiff(['-function oldFn() {}'])
    const result = analyzeDiff(diff)
    expect(result.removedSymbols).toContain('oldFn')
    expect(result.addedSymbols).not.toContain('oldFn')
  })

  it('deduplicates repeated symbols', () => {
    const diff = makeDiff([
      '+function doThing() {',
      '+function doThing() {', // duplicate
    ])
    const result = analyzeDiff(diff)
    expect(result.addedSymbols.filter((s) => s === 'doThing')).toHaveLength(1)
  })

  it('collects multiple distinct added symbols', () => {
    const diff = makeDiff([
      '+export function parseInput() {}',
      '+export function formatOutput() {}',
      '+export class DataTransformer {}',
    ])
    const result = analyzeDiff(diff)
    expect(result.addedSymbols).toContain('parseInput')
    expect(result.addedSymbols).toContain('formatOutput')
    expect(result.addedSymbols).toContain('DataTransformer')
  })
})

// ---------------------------------------------------------------------------
// Symbol extraction — Python
// ---------------------------------------------------------------------------

describe('analyzeDiff — Python symbol extraction', () => {
  it('detects an added Python function', () => {
    const diff = makeDiff(['+def validate_token(token):'])
    expect(analyzeDiff(diff).addedSymbols).toContain('validate_token')
  })

  it('detects an added async Python function', () => {
    const diff = makeDiff(['+async def fetch_user(user_id):'])
    expect(analyzeDiff(diff).addedSymbols).toContain('fetch_user')
  })

  it('detects an added Python class', () => {
    const diff = makeDiff(['+class UserRepository(Base):'])
    expect(analyzeDiff(diff).addedSymbols).toContain('UserRepository')
  })
})

// ---------------------------------------------------------------------------
// Symbol extraction — Go
// ---------------------------------------------------------------------------

describe('analyzeDiff — Go symbol extraction', () => {
  it('detects an added Go function', () => {
    const diff = makeDiff(['+func handleRequest(w http.ResponseWriter) {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('handleRequest')
  })

  it('detects an added Go method', () => {
    const diff = makeDiff(['+func (s *Server) Shutdown() error {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('Shutdown')
  })
})

// ---------------------------------------------------------------------------
// Symbol extraction — Rust
// ---------------------------------------------------------------------------

describe('analyzeDiff — Rust symbol extraction', () => {
  it('detects an added Rust function', () => {
    const diff = makeDiff(['+pub fn parse_config(input: &str) -> Config {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('parse_config')
  })

  it('detects an added Rust struct', () => {
    const diff = makeDiff(['+pub struct DatabaseConnection {'])
    expect(analyzeDiff(diff).addedSymbols).toContain('DatabaseConnection')
  })
})

// ---------------------------------------------------------------------------
// Fix pattern detection
// ---------------------------------------------------------------------------

describe('analyzeDiff — fix pattern detection', () => {
  it('detects "fix" keyword in an added line', () => {
    const diff = makeDiff(['+// fix: handle empty string edge case'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })

  it('detects "bug" keyword in an added line', () => {
    const diff = makeDiff(['+// resolves bug in token refresh'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })

  it('detects "error" keyword in an added line', () => {
    const diff = makeDiff(['+  throw new Error("invalid input")'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })

  it('detects "resolve" keyword in an added line', () => {
    const diff = makeDiff(['+// resolve the race condition in scheduler'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })

  it('detects "crash" keyword in an added line', () => {
    const diff = makeDiff(['+// prevent crash when config is null'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })

  it('detects "invalid" keyword in an added line', () => {
    const diff = makeDiff(['+if (!token) throw new Error("invalid token")'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })

  it('does NOT trigger on fix keywords in removed lines', () => {
    const diff = makeDiff(['-// fix this later'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(false)
  })

  it('does NOT trigger on unrelated added lines', () => {
    const diff = makeDiff(['+const name = "alice"'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(false)
  })

  it('is case-insensitive', () => {
    const diff = makeDiff(['+// FIX: null pointer in auth module'])
    expect(analyzeDiff(diff).hasFixPattern).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Test pattern detection
// ---------------------------------------------------------------------------

describe('analyzeDiff — test pattern detection', () => {
  it('detects describe()', () => {
    const diff = makeDiff(["+describe('auth', () => {"])
    expect(analyzeDiff(diff).hasTestPattern).toBe(true)
  })

  it('detects it()', () => {
    const diff = makeDiff(["+  it('returns 200 for valid token', () => {"])
    expect(analyzeDiff(diff).hasTestPattern).toBe(true)
  })

  it('detects test()', () => {
    const diff = makeDiff(["+test('parses config correctly', () => {"])
    expect(analyzeDiff(diff).hasTestPattern).toBe(true)
  })

  it('detects expect()', () => {
    const diff = makeDiff(['+  expect(result).toBe(true)'])
    expect(analyzeDiff(diff).hasTestPattern).toBe(true)
  })

  it('detects beforeEach', () => {
    const diff = makeDiff(['+beforeEach(() => { db.reset() })'])
    expect(analyzeDiff(diff).hasTestPattern).toBe(true)
  })

  it('detects afterAll', () => {
    const diff = makeDiff(['+afterAll(() => server.close())'])
    expect(analyzeDiff(diff).hasTestPattern).toBe(true)
  })

  it('does NOT trigger on unrelated lines', () => {
    const diff = makeDiff(['+const result = compute(input)'])
    expect(analyzeDiff(diff).hasTestPattern).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Net line counting
// ---------------------------------------------------------------------------

describe('analyzeDiff — net line counting', () => {
  it('counts net positive (more additions than deletions)', () => {
    const diff = makeDiff(['+line1', '+line2', '+line3', '-old1'])
    expect(analyzeDiff(diff).netLines).toBe(2) // 3 added - 1 removed
  })

  it('counts net negative (more deletions than additions)', () => {
    const diff = makeDiff(['-line1', '-line2', '-line3', '+new1'])
    expect(analyzeDiff(diff).netLines).toBe(-2) // 1 added - 3 removed
  })

  it('counts zero net lines when balanced', () => {
    const diff = makeDiff(['+new line', '-old line'])
    expect(analyzeDiff(diff).netLines).toBe(0)
  })

  it('does not count diff metadata lines', () => {
    // The header lines (+++, ---, @@) must not affect the count
    const result = analyzeDiff(
      [
        'diff --git a/f.ts b/f.ts',
        '--- a/f.ts',
        '+++ b/f.ts',
        '@@ -1 +1 @@',
        '+actual addition',
      ].join('\n')
    )
    expect(result.netLines).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Package import detection
// ---------------------------------------------------------------------------

describe('analyzeDiff — added package detection', () => {
  it('detects a newly imported npm package (named import)', () => {
    const diff = makeDiff(["+import { z } from 'zod'"])
    expect(analyzeDiff(diff).addedPackages).toContain('zod')
  })

  it('detects a newly imported npm package (default import)', () => {
    const diff = makeDiff(["+import express from 'express'"])
    expect(analyzeDiff(diff).addedPackages).toContain('express')
  })

  it('detects a require() call', () => {
    const diff = makeDiff(["+const path = require('node:path')"])
    expect(analyzeDiff(diff).addedPackages).toContain('node:path')
  })

  it('does NOT detect relative imports', () => {
    const diff = makeDiff(["+import { foo } from './utils'"])
    expect(analyzeDiff(diff).addedPackages).toHaveLength(0)
  })

  it('does NOT detect removed imports', () => {
    const diff = makeDiff(["-import { old } from 'old-package'"])
    expect(analyzeDiff(diff).addedPackages).toHaveLength(0)
  })

  it('deduplicates repeated package imports', () => {
    const diff = makeDiff([
      "+import { a } from 'lodash'",
      "+import { b } from 'lodash'",
    ])
    expect(
      analyzeDiff(diff).addedPackages.filter((p) => p === 'lodash')
    ).toHaveLength(1)
  })
})
