import { generatePuzzle } from '../lib/generator.ts'
import type { Difficulty } from '../lib/types.ts'

export interface WorkerRequest { id: number; difficulty: Difficulty; seed: number }

self.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  const { id, difficulty, seed } = data
  try {
    self.postMessage({ id, puzzle: generatePuzzle(difficulty, seed) })
  } catch (e) {
    self.postMessage({ id, error: e instanceof Error ? e.message : String(e) })
  }
}
