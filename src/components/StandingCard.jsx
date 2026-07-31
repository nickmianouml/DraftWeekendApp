import "../styles/standingCard.css";

function StandingCard({ standing }) {
  let medal = `#${standing.rank}`;

  if (standing.rank === 1) medal = "🥇";
  if (standing.rank === 2) medal = "🥈";
  if (standing.rank === 3) medal = "🥉";

  return (
    <div className="standing-card">
      <div className="standing-header">
        <div className="standing-player">
          <span className="medal">{medal}</span>

          <span>{standing.player}</span>
        </div>

        <div className="standing-points">
          {standing.points.toLocaleString()} pts
        </div>
      </div>

      <div className="standing-stats">
        <span>🎲 {standing.spins} Spins</span>

        <span>{standing.pointsPerSpin} pts/spin</span>
      </div>
    </div>
  );
}

export default StandingCard;