import { describe, it, expect } from 'vitest'
import {
  ROWS,
  COLS,
  BOXES,
  UNITS,
  PEERS,
  UNITS_OF,
  rowOf,
  colOf,
  boxOf,
  parseGrid,
  serializeGrid,
} from './grid.ts'

const PUZZLE =
  '53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79'

describe('index helpers', () => {
  it('computes row, col and box', () => {
    expect([rowOf(0), colOf(0), boxOf(0)]).toEqual([0, 0, 0])
    expect([rowOf(40), colOf(40), boxOf(40)]).toEqual([4, 4, 4])
    expect([rowOf(26), colOf(26), boxOf(26)]).toEqual([2, 8, 2])
    expect([rowOf(80), colOf(80), boxOf(80)]).toEqual([8, 8, 8])
    expect(boxOf(30)).toBe(4)
  })
})

describe('units', () => {
  it('has 27 units of 9 cells', () => {
    expect(UNITS).toHaveLength(27)
    for (const unit of UNITS) expect(new Set(unit).size).toBe(9)
  })

  it('rows, columns and boxes each cover every cell once', () => {
    for (const group of [ROWS, COLS, BOXES]) {
      expect(group).toHaveLength(9)
      expect(group.flat().toSorted((a, b) => a - b)).toEqual(Array.from({ length: 81 }, (_, i) => i))
    }
  })

  it('UNITS_OF has 3 units per cell, each containing the cell', () => {
    expect(UNITS_OF).toHaveLength(81)
    UNITS_OF.forEach((units, i) => {
      expect(units).toHaveLength(3)
      for (const unit of units) expect(unit).toContain(i)
    })
  })
})

describe('PEERS', () => {
  it('has 20 unique entries per cell, excluding the cell itself', () => {
    expect(PEERS).toHaveLength(81)
    PEERS.forEach((peers, i) => {
      expect(peers).toHaveLength(20)
      expect(new Set(peers).size).toBe(20)
      expect(peers).not.toContain(i)
    })
  })

  it('is symmetric', () => {
    PEERS.forEach((peers, i) => {
      for (const p of peers) expect(PEERS[p]).toContain(i)
    })
  })
})

describe('parseGrid / serializeGrid', () => {
  it('round-trips', () => {
    expect(serializeGrid(parseGrid(PUZZLE))).toBe(PUZZLE)
  })

  it('treats "." and "0" as empty and serializes them as "."', () => {
    const grid = parseGrid('0'.repeat(80) + '5')
    expect(grid[0]).toBe(0)
    expect(grid[80]).toBe(5)
    expect(serializeGrid(grid)).toBe('.'.repeat(80) + '5')
    expect(parseGrid('.'.repeat(81))).toEqual(parseGrid('0'.repeat(81)))
  })

  it('throws on invalid length', () => {
    expect(() => parseGrid('.'.repeat(80))).toThrow()
    expect(() => parseGrid('.'.repeat(82))).toThrow()
    expect(() => serializeGrid(parseGrid(PUZZLE).slice(1))).toThrow()
  })

  it('throws on invalid characters', () => {
    expect(() => parseGrid('x' + '.'.repeat(80))).toThrow()
    expect(() => parseGrid(' ' + '.'.repeat(80))).toThrow()
    expect(() => parseGrid('-' + '.'.repeat(80))).toThrow()
  })
})
