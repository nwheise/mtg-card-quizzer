// Session score plus the persisted best streak.
export function Scoreboard({
  answered,
  correct,
  streak,
  bestStreak,
}: {
  answered: number;
  correct: number;
  streak: number;
  bestStreak: number;
}) {
  const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  return (
    <div className="scoreboard">
      <Stat label="Score" value={`${correct}/${answered}`} />
      <Stat label="Accuracy" value={`${pct}%`} />
      <Stat label="Streak" value={String(streak)} />
      <Stat label="Best" value={String(bestStreak)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
