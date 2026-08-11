import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPlayers } from "../services/players";
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

        const [playersData, liveData] =
          await Promise.all([
            getPlayers(),
            getLiveData(),
          ]);

        const sortedStandings = [...playersData].sort(
          (a, b) => {
            if (a.standings !== b.standings) {
              return a.standings - b.standings;
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
        <h1
          style={{
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          🏆 2026 Standings
        </h1>

        <p>Loading standings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="standings-page">
        <h1
          style={{
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          🏆 2026 Standings
        </h1>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="standings-page">
      <div
        className="standings-heading"
        style={{
          display: "block",
          textAlign: "center",
        }}
      >
        <div>
          <h1
            style={{
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "4px",
            }}
          >
            🏆 2026 Standings
          </h1>

          <p className="standings-live">
            ● LIVE
          </p>
        </div>

        {lastUpdated && (
          <p
            className="standings-updated"
            style={{
              textAlign: "center",
            }}
          >
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
            player.standings || index + 1;

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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(3, 1fr)",
                    borderTop:
                      "1px solid #30363d",
                  }}
                >
                  <PlayerStat
                    label="Points"
                    value={Number(
                      player.points || 0
                    ).toLocaleString()}
                    borderRight
                    borderBottom
                  />

                  <PlayerStat
                    label="Spins"
                    value={player.spins || 0}
                    borderRight
                    borderBottom
                  />

                  <PlayerStat
                    label="Spin Rank"
                    value={
                      player.spinRank
                        ? `#${player.spinRank}`
                        : "-"
                    }
                    borderBottom
                  />

                  <PlayerStat
                    label="SPG"
                    value={formatStat(
                      player.spinsPerGame
                    )}
                    borderRight
                  />

                  <PlayerStat
                    label="PPS"
                    value={formatStat(
                      player.pointsPerSpin
                    )}
                    borderRight
                  />

                  <PlayerStat
                    label="100s"
                    value={
                      player.hundreds || 0
                    }
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

function PlayerStat({
  label,
  value,
  borderRight = false,
  borderBottom = false,
}) {
  return (
    <div
      style={{
        padding: "16px 8px",
        textAlign: "center",
        borderRight: borderRight
          ? "1px solid #30363d"
          : "none",
        borderBottom: borderBottom
          ? "1px solid #30363d"
          : "none",
      }}
    >
      <span
        style={{
          display: "block",
          color: "#8b949e",
          fontSize: "11px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#ffffff",
          fontSize: "16px",
        }}
      >
        {value}
      </strong>
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

function formatStat(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.000";
  }

  return number.toFixed(3);
}

export default Standings;