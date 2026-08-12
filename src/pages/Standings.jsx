import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPlayers } from "../services/players";
import { getLiveData } from "../services/live";
import { getAllPlayerRecords } from "../services/playerRecord";

import "../styles/standingsPage.css";

function Standings() {
  const [standings, setStandings] = useState([]);
  const [live, setLive] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function loadStandings() {
      try {
        setError("");

        const [
          playersData,
          liveData,
          recordsData,
        ] = await Promise.all([
          getPlayers(),
          getLiveData(),
          getAllPlayerRecords(),
        ]);

        const sortedStandings =
          [...playersData].sort((a, b) => {
            if (a.standings !== b.standings) {
              return a.standings - b.standings;
            }

            return b.points - a.points;
          });

        setStandings(sortedStandings);
        setLive(liveData);
        setRecords(recordsData);
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

  const firstPlacePoints =
    standings.length > 0
      ? Math.max(
          ...standings.map((player) =>
            Number(player.points || 0)
          )
        )
      : 0;

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
            {lastUpdated.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className="standings-summary">
        <SummaryTile
          icon="🔥"
          label="Luckiest"
          value={formatPPS(
            live?.["Highest PPS"]
          )}
          showPPS
          detail={
            live?.["Hottest Player"] || ""
          }
        />

        <SummaryTile
          icon="🎡"
          label="Total Spins"
          value={
            live?.["Total Spins"] || "0"
          }
          detail="Awarded"
        />

        <SummaryTile
          icon="☘️"
          label="Unluckiest"
          value={formatPPS(
            live?.["Lowest PPS"]
          )}
          showPPS
          detail={
            live?.["Unluckiest Player"] ||
            ""
          }
        />

        <SummaryTile
          icon="🍺"
          label="Total Porch Beers"
          value={
            live?.["Total Porch Beers"] ||
            "0"
          }
          detail="Spun"
        />
      </div>

      <div className="standings-list">
        {standings.map(
          (player, index) => {
            const rank =
              player.standings ||
              index + 1;

            const pointsBehind =
              Math.max(
                0,
                firstPlacePoints -
                  Number(player.points || 0)
              );

            const record =
              findPlayerRecord(
                records,
                player.player
              );

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

                    <div
                      className="standing-player"
                      style={{
                        display: "flex",
                        flexDirection:
                          "column",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                      }}
                    >
                      <strong
                        style={{
                          color: "#ffffff",
                          fontSize: "20px",
                        }}
                      >
                        {player.player}
                      </strong>

                      <div
                        style={{
                          marginTop: "5px",
                          display: "flex",
                          alignItems:
                            "baseline",
                          justifyContent:
                            "center",
                          gap: "5px",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#f2cc60",
                            fontSize:
                              "22px",
                            lineHeight: 1,
                          }}
                        >
                          {Number(
                            player.points || 0
                          ).toLocaleString()}
                        </strong>

                        <span
                          style={{
                            color:
                              "#f2cc60",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Points
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "7px",
                          color: "#8b949e",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        {record.wins}-{record.losses}
                        {" · "}
                        {formatWinPct(record.winPct)}
                        {" · "}
                        Win Rank #{record.winRank}
                      </div>
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
                      label="Spins"
                      value={
                        player.spins || 0
                      }
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
                      borderRight
                      borderBottom
                    />

                    <PlayerStat
                      label="Spins Per Game"
                      value={formatStat(
                        player.spinsPerGame
                      )}
                      borderBottom
                    />

                    <PlayerStat
                      label="Points Per Spin"
                      value={formatStat(
                        player.pointsPerSpin
                      )}
                      borderRight
                    />

                    <PlayerStat
                      label="Points Behind 1st"
                      value={pointsBehind}
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
          }
        )}
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  showPPS = false,
  detail,
}) {
  return (
    <div className="standings-summary-tile">
      <span className="summary-label">
        {icon} {label}
      </span>

      {showPPS ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            textAlign: "center",
          }}
        >
          <strong className="summary-value">
            {value}
          </strong>

          <span
            style={{
              position: "absolute",
              left: "calc(50% + 48px)",
              top: "50%",
              transform:
                "translateY(-50%)",
              color: "#8b949e",
              fontSize: "11px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
            }}
          >
            PPS
          </span>
        </div>
      ) : (
        <strong className="summary-value">
          {value}
        </strong>
      )}

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

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findPlayerRecord(
  records,
  playerName
) {
  return (
    records.find(
      (record) =>
        normalizeName(record.player) ===
        normalizeName(playerName)
    ) || {
      wins: 0,
      losses: 0,
      winPct: 0,
      winRank: 1,
    }
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

function formatPPS(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0";
  }

  if (Number.isInteger(number)) {
    return number.toString();
  }

  return number.toFixed(3);
}

function formatWinPct(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.0%";
  }

  return `${(number * 100).toFixed(1)}%`;
}

export default Standings;