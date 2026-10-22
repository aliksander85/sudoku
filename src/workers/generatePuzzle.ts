import type { Difficulty, Puzzle } from '../lib/types.ts'
import type { WorkerRequest } from './generator.worker.ts'

interface Pending { resolve: (puzzle: Puzzle) => void; reject: (error: Error) => void }

let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, Pending>()

function rejectAll(error: Error) {
  for (const { reject } of pending.values()) reject(error)
  pending.clear()
}

function getWorker(): Worker {
  if (worker) return worker
  const w = new Worker(new URL('./generator.worker.ts', import.meta.url), { type: 'module' })
  w.onmessage = ({ data }: MessageEvent<{ id: number; puzzle?: Puzzle; error?: string }>) => {
    const entry = pending.get(data.id)
    if (!entry) return
    pending.delete(data.id)
    if (data.puzzle) entry.resolve(data.puzzle)
    else entry.reject(new Error(data.error ?? 'Puzzle generation failed'))
  }
  w.onerror = (event) => {
    worker = null
    rejectAll(new Error(event.message || 'Generator worker crashed'))
  }
  worker = w
  return w
}

export function generatePuzzle(
  difficulty: Difficulty,
  seed: number = Math.floor(Math.random() * 2 ** 32),
): Promise<Puzzle> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    const request: WorkerRequest = { id, difficulty, seed }
    getWorker().postMessage(request)
  })
}
