import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getStandings } from "../services/googleSheets";
import { getLiveData } from "../services/live";

import "../styles/standingsPage.css";

function Standings() {
  const [standings, setStandings] = useState([]);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function loadStandings() {
      try {
        setError("");

        const [standingsData, liveData] =
          await Promise.all([
            getStandings(),
            getLiveData(),
          ]);

        const sortedStandings = [...standingsData].sort(
          (a, b) => {
            if (a.rank !== b.rank) {
              return a.rank - b.rank;
            }

            return b.points - a.points;
          }
        );

        setStandings(sortedStandings);
        setLive(liveData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Standings page error:",
          err
        );

        setError(
          "Unable to load the live standings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadStandings();

    const interval = setInterval(
      loadStandings,
      10000
    );

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="standings-page">
        <h1>🏆 2026 Standings</h1>

        <p>Loading standings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="standings-page">
        <h1>🏆 2026 Standings</h1>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="standings-page">
      <div className="standings-heading">
        <div>
          <h1>🏆 2026 Standings</h1>

          <p className="standings-live">
            ● LIVE
          </p>
        </div>

        {lastUpdated && (
          <p className="standings-updated">
            Updated{" "}
            {lastUpdated.toLocaleTimeString(
              [],
              {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              }
            )}
          </p>
        )}
      </div>

      <div className="standings-summary">
        <SummaryTile
          icon="🔥"
          label="Highest PPS"
          value={
            live?.["Highest PPS"] || "0"
          }
          detail={
            live?.["Hottest Player"] || ""
          }
        />

        <SummaryTile
          icon="🎲"
          label="Total Spins"
          value={live?.["Total Spins"] || "0"}
          detail="Awarded"
        />
      </div>

      <div className="standings-list">
        {standings.map((player, index) => {
          const rank =
            player.rank || index + 1;

          return (
            <Link
              key={player.player}
              to={`/players/${encodeURIComponent(
                player.player
              )}`}
              className="standing-player-link"
            >
              <div
                className={`standing-row ${
                  rank === 1
                    ? "standing-first"
                    : ""
                }`}
              >
                <div className="standing-main">
                  <div className="standing-rank">
                    {getRankDisplay(rank)}
                  </div>

                  <div className="standing-player">
                    <strong>
                      {player.player}
                    </strong>

                    <span>
                      {Number(
                        player.points || 0
                      ).toLocaleString()}{" "}
                      points
                    </span>
                  </div>

                  <div className="standing-arrow">
                    ›
                  </div>
                </div>

                <div className="standing-stats">
                  <PlayerStat
                    label="Points"
                    value={Number(
                      player.points || 0
                    ).toLocaleString()}
                  />

                  <PlayerStat
                    label="Spins"
                    value={player.spins || 0}
                  />

                  <PlayerStat
                    label="PPS"
                    value={formatPPS(
                      player.pointsPerSpin
                    )}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  detail,
}) {
  return (
    <div className="standings-summary-tile">
      <span className="summary-label">
        {icon} {label}
      </span>

      <strong className="summary-value">
        {value}
      </strong>

      <span className="summary-detail">
        {detail}
      </span>
    </div>
  );
}

function PlayerStat({ label, value }) {
  return (
    <div className="standing-stat">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function getRankDisplay(rank) {
  if (rank === 1) {
    return "🥇";
  }

  if (rank === 2) {
    return "🥈";
  }

  if (rank === 3) {
    return "🥉";
  }

  return `#${rank}`;
}

function formatPPS(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.000";
  }

  return number.toFixed(3);
}

export default Standings;