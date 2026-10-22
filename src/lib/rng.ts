export type Rng = () => number

// mulberry32: small, fast, seedable PRNG. Returns floats in [0, 1).
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Integer in [0, n).
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n)
}

// Fisher–Yates over a copy; the input array is not mutated.
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
