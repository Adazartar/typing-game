interface ScoreDisplayProps {
  score: number
}

export default function ScoreDisplay({ score }: ScoreDisplayProps) {
  const isPositive = score >= 0

  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-zinc-400 uppercase tracking-widest mb-0.5">Score</span>
      <span
        className={`text-3xl font-bold font-mono tabular-nums transition-colors ${isPositive ? 'text-white' : 'text-red-400'}`}
      >
        {score}
      </span>
    </div>
  )
}
