import { useMemo } from 'react'
import type { EvaluatedWord, Word } from '../types'

interface LyricsDisplayProps {
  words: Word[]
  currentTime: number
  queue: number[]
  evaluatedWords: EvaluatedWord[]
}

const PX_PER_MS = 0.08
const NOW_LINE_PX = 300
const ROW_HEIGHT = 32
const TOP_PAD = 8
const VISIBLE_ROWS = 5
const CONTAINER_HEIGHT = VISIBLE_ROWS * ROW_HEIGHT + TOP_PAD * 2

// Center Y of a given display row
const rowY = (displayRow: number) => TOP_PAD + displayRow * ROW_HEIGHT + ROW_HEIGHT / 2

// Pre-compute a static row for every word.
// A word overlapping the previous one stays on the same row;
// every non-overlapping step adds one row — producing the staircase.
function computeStaticRows(words: Word[]): number[] {
  const rows: number[] = []
  for (let i = 0; i < words.length; i++) {
    if (i === 0) { rows.push(0); continue }
    const prev = words[i - 1]
    const overlaps = words[i].offset < prev.offset + prev.duration
    rows.push(overlaps ? rows[i - 1] + 1: rows[i - 1])
  }
  return rows
}

export default function LyricsDisplay({
  words,
  currentTime,
  queue,
  evaluatedWords,
}: LyricsDisplayProps) {
  const staticRows = useMemo(() => computeStaticRows(words), [words])
  const evaluatedMap = new Map(evaluatedWords.map(e => [e.index, e]))

  // The current target's static row is the baseline — everything is offset from it.
  // When queue is empty (gap between words), use the next upcoming word's staticRow
  // so baseRow never snaps back to 0 and causes a visible jump.
  const baseRow = (() => {
    if (queue.length > 0) return staticRows[queue[0]]
    for (let i = 0; i < words.length; i++) {
      if (!evaluatedMap.has(i)) return staticRows[i]
    }
    return 0
  })()

  return (
    <div
      className="relative w-full bg-zinc-900 border-y border-zinc-700 overflow-hidden select-none"
      style={{ height: CONTAINER_HEIGHT }}
    >
      {/* Now line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-violet-500 z-10"
        style={{ left: NOW_LINE_PX }}
      />

      {words.map((w, i) => {
        const evaluated = evaluatedMap.get(i)
        const queuePos = queue.indexOf(i)
        const isPrimary = queuePos === 0
        const isPast = evaluated !== undefined

        const xFromNow = (w.offset - currentTime) * PX_PER_MS
        const left = NOW_LINE_PX + xFromNow
        const width = Math.max(w.duration * PX_PER_MS, 40)

        // displayRow < 0 → above container (fades out after being consumed + shift)
        const displayRow = staticRows[i] - baseRow
        const top = rowY(displayRow)

        let bgColor = 'bg-zinc-700 text-zinc-300'
        if (isPrimary) bgColor = 'bg-violet-600 text-white'
        else if (isPast)
          bgColor = evaluated!.correct
            ? 'bg-green-700 text-green-100'
            : 'bg-red-800 text-red-100'

        return (
          <div
            key={i}
            className={`absolute flex items-center justify-center rounded px-2 py-1 text-sm font-mono ${bgColor}`}
            style={{
              left,
              top,
              width,
              transition: 'top 220ms ease, background-color 150ms ease',
            }}
          >
            <span className="truncate">{w.word}</span>
          </div>
        )
      })}
    </div>
  )
}
