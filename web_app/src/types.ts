export interface Word {
  word: string
  offset: number
  duration: number
}

export interface SongData {
  title: string
  spotifyTrackId: string
  words: Word[]
}

export type GameState = 'idle' | 'playing' | 'finished'

export interface EvaluatedWord {
  index: number
  word: string
  typed: string
  correct: boolean
}
