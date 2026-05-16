import { useEffect, useRef } from 'react'
import songData from './data/lyrics_fixed.json'
import type { SongData } from './types'
import { useGameLoop } from './hooks/useGameLoop'
import LyricsDisplay from './components/LyricsDisplay'
import TypingInput from './components/TypingInput'
import ScoreDisplay from './components/ScoreDisplay'

declare const YT: {
  Player: new (
    el: string | HTMLElement,
    options: {
      videoId: string
      width?: string | number
      height?: string | number
      playerVars?: Record<string, unknown>
      events?: {
        onStateChange?: (e: { data: number }) => void
        onReady?: () => void
      }
    }
  ) => { destroy: () => void }
  PlayerState: { PLAYING: number }
}

const VIDEO_ID = 'Jqt2yvDEgFE'
const song = songData as SongData

export default function App() {
  const playerRef = useRef<{ destroy: () => void } | null>(null)
  const startLevelRef = useRef<() => void>(() => {})

  const {
    gameState,
    currentTime,
    score,
    inputValue,
    queue,
    evaluatedWords,
    handleInputChange,
    startLevel,
  } = useGameLoop(song)

  // Keep ref in sync so the YT callback always calls the latest startLevel
  useEffect(() => {
    startLevelRef.current = startLevel
  })

  const showFinished = gameState === 'finished'

  useEffect(() => {
    const initPlayer = () => {
      playerRef.current = new YT.Player('yt-player', {
        videoId: VIDEO_ID,
        width: '100%',
        playerVars: { origin: window.location.origin },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              startLevelRef.current()
            }
          },
        },
      })
    }

    if (typeof YT !== 'undefined' && YT.Player) {
      initPlayer()
    } else {
      ;(window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      playerRef.current?.destroy()
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-semibold text-white">{song.title}</h1>
          <p className="text-xs text-zinc-400 font-mono">
            {gameState === 'playing'
              ? `${(currentTime / 1000).toFixed(1)}s`
              : gameState === 'finished'
              ? 'Finished'
              : 'Ready'}
          </p>
        </div>
        <ScoreDisplay score={score} />
      </header>

      {/* YouTube embed */}
      <div className="px-6 pt-6">
        <div id="yt-player" style={{ borderRadius: '12px', overflow: 'hidden' }} />
      </div>

      {/* Lyrics timeline */}
      <div className="mt-6">
        <LyricsDisplay
          words={song.words}
          currentTime={currentTime}
          queue={queue}
          evaluatedWords={evaluatedWords}
        />
      </div>

      {/* Typing area */}
      <div className="px-6 py-5">
        <TypingInput
          value={inputValue}
          onChange={handleInputChange}
          gameState={gameState}
          queue={queue}
          words={song.words}
        />
      </div>

      {/* Finished summary */}
      {showFinished && (
        <div className="mx-6 mb-4 p-4 rounded-lg bg-zinc-800 border border-zinc-700">
          <p className="text-center text-zinc-300 text-sm">
            Level complete —{' '}
            <span className={score >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
              {score} pts
            </span>
            {' '}({evaluatedWords.filter(e => e.correct).length}/{song.words.length} correct)
          </p>
        </div>
      )}
    </div>
  )
}
