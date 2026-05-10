import { useEffect, useRef } from 'react'
import songData from './data/song1.json'
import type { SongData } from './types'
import { useGameLoop } from './hooks/useGameLoop'
import LyricsDisplay from './components/LyricsDisplay'
import TypingInput from './components/TypingInput'
import ScoreDisplay from './components/ScoreDisplay'

const song = songData as SongData

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  const showFinished = gameState === 'finished'

  useEffect(() => {
    if (gameState !== 'idle' && gameState !== 'finished') return
  
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'playback_started') {
        startLevel()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [gameState, startLevel])

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

      {/* Spotify iframe + click-to-start overlay */}
      <div className="relative px-6 pt-6">
        <iframe
          ref={iframeRef}
          data-testid="embed-iframe"
          style={{ borderRadius: '12px' }}
          src="https://open.spotify.com/embed/track/6wHpLMmp98aHcV8L1JFrj8?utm_source=generator"
          width="100%"
          height="152"
          frameBorder={0}
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
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
