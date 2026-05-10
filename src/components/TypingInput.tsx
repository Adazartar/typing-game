import { useEffect, useRef } from 'react'
import type { GameState, Word } from '../types'

interface TypingInputProps {
  value: string
  onChange: (value: string) => void
  gameState: GameState
  queue: number[]
  words: Word[]
}

export default function TypingInput({
  value,
  onChange,
  gameState,
  queue,
  words,
}: TypingInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (gameState === 'playing') {
      inputRef.current?.focus()
    }
  }, [gameState])

  const targetWord = queue.length > 0 ? words[queue[0]] : null
  const isPlaying = gameState === 'playing'

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Backspace') {
            e.preventDefault()
            onChange('')
          }
        }}
        disabled={!isPlaying}
        placeholder={
          targetWord
            ? `Type: ${targetWord.word}`
            : isPlaying
            ? 'Wait...'
            : 'Click play to start'
        }
        className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white font-mono text-lg placeholder-zinc-500 focus:outline-none focus:border-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      {targetWord && isPlaying && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono pointer-events-none">
          {targetWord.word}
        </span>
      )}
    </div>
  )
}
