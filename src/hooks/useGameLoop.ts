import { useCallback, useEffect, useRef, useState } from 'react'
import type { EvaluatedWord, GameState, SongData } from '../types'

interface UseGameLoopReturn {
  gameState: GameState
  currentTime: number
  score: number
  inputValue: string
  queue: number[]
  evaluatedWords: EvaluatedWord[]
  handleInputChange: (value: string) => void
  startLevel: () => void
}

export function useGameLoop(song: SongData): UseGameLoopReturn {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [score, setScore] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [evaluatedWords, setEvaluatedWords] = useState<EvaluatedWord[]>([])
  const [queue, setQueue] = useState<number[]>([])

  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const evaluatedSetRef = useRef<Set<number>>(new Set())
  // rAF-safe source of truth for the queue and input
  const queueRef = useRef<number[]>([])
  const inputRef = useRef('')

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Holds the latest tick so the rAF loop can call it without a self-referencing closure
  const tickRef = useRef<() => void>(() => {})

  const tick = useCallback(() => {
    if (startTimeRef.current === null) return

    const elapsed = performance.now() - startTimeRef.current
    setCurrentTime(elapsed)

    let queueChanged = false

    // If the current input already matches queue[0], consume it immediately
    const checkInputAgainstQueue = () => {
      if (queueRef.current.length === 0) return
      const targetIndex = queueRef.current[0]
      const targetWord = song.words[targetIndex]
      const typed = inputRef.current.trim()
      if (typed.toLowerCase() === targetWord.word.toLowerCase()) {
        evaluatedSetRef.current.add(targetIndex)
        setScore(prev => prev + 10)
        setEvaluatedWords(prev => [
          ...prev,
          { index: targetIndex, word: targetWord.word, typed, correct: true },
        ])
        queueRef.current = queueRef.current.slice(1)
        inputRef.current = ''
        setInputValue('')
        queueChanged = true
      }
    }

    // Enqueue words whose offset has been reached
    song.words.forEach((word, i) => {
      if (evaluatedSetRef.current.has(i)) return
      if (elapsed >= word.offset && !queueRef.current.includes(i)) {
        queueRef.current = [...queueRef.current, i]
        queueChanged = true
        // If this word is now first in the queue, check if it's already typed
        if (queueRef.current[0] === i) checkInputAgainstQueue()
      }
    })

    // Expire words whose window has ended (mark as missed)
    song.words.forEach((word, i) => {
      if (evaluatedSetRef.current.has(i)) return
      const windowEnd = word.offset + word.duration
      if (elapsed >= windowEnd && queueRef.current.includes(i)) {
        const wasFirst = queueRef.current[0] === i
        evaluatedSetRef.current.add(i)
        setScore(prev => prev - 10)
        setEvaluatedWords(prev => [
          ...prev,
          { index: i, word: word.word, typed: '', correct: false },
        ])
        queueRef.current = queueRef.current.filter(idx => idx !== i)
        queueChanged = true
        // Do NOT clear input — user may be mid-typing the next word.
        // But if the expired word was at the front, check if input matches the new queue[0]
        if (wasFirst) checkInputAgainstQueue()
      }
    })

    if (queueChanged) {
      setQueue([...queueRef.current])
    }

    const allDone = song.words.every((_, i) => evaluatedSetRef.current.has(i))
    if (allDone) {
      setGameState('finished')
      stopLoop()
      return
    }

    rafRef.current = requestAnimationFrame(tickRef.current)
  }, [song, stopLoop])

  // Keep tickRef pointing at the freshest tick after every render
  useEffect(() => {
    tickRef.current = tick
  })

  // Called on every keystroke — checks for an immediate match against queue[0]
  const handleInputChange = useCallback(
    (value: string) => {
      inputRef.current = value
      setInputValue(value)

      if (queueRef.current.length === 0) return

      const targetIndex = queueRef.current[0]
      const targetWord = song.words[targetIndex]

      if (value.trim().toLowerCase() === targetWord.word.toLowerCase()) {
        evaluatedSetRef.current.add(targetIndex)
        setScore(prev => prev + 10)
        setEvaluatedWords(prev => [
          ...prev,
          { index: targetIndex, word: targetWord.word, typed: value.trim(), correct: true },
        ])
        queueRef.current = queueRef.current.slice(1)
        setQueue([...queueRef.current])
        inputRef.current = ''
        setInputValue('')
      }
    },
    [song]
  )

  const startLevel = useCallback(() => {
    if (gameState !== 'idle' && gameState !== 'finished') return

    setScore(0)
    setCurrentTime(0)
    setEvaluatedWords([])
    setInputValue('')
    setQueue([])
    evaluatedSetRef.current = new Set()
    queueRef.current = []
    inputRef.current = ''
    stopLoop()

    startTimeRef.current = performance.now()
    setGameState('playing')
    rafRef.current = requestAnimationFrame(tick)
  }, [gameState, stopLoop, tick])

  useEffect(() => {
    return () => {
      stopLoop()
    }
  }, [stopLoop])

  return {
    gameState,
    currentTime,
    score,
    inputValue,
    queue,
    evaluatedWords,
    handleInputChange,
    startLevel,
  }
}
