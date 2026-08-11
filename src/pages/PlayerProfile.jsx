import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getPlayer } from "../services/players";
import { getPlayerGames } from "../services/playerGames";
import games from "../data/games";

function PlayerProfile() {
  const { playerName } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);
  const [playerGames, setPlayerGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlayerProfile() {
      try {
        setError("");
        setLoading(true);

        const [playerData, gamesData] =
          await Promise.all([
            getPlayer(playerName),
            getPlayerGames(playerName),
          ]);

        setPlayer(playerData);
        setPlayerGames(gamesData);
      } catch (err) {
        console.error(
          "Player profile error:",
          err
        );

        setError(
          "Unable to load player profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlayerProfile();

    const interval = setInterval(
      loadPlayerProfile,
      30000
    );

    return () => clearInterval(interval);
  }, [playerName]);

  if (loading) {
    return (
      <p>
        Loading player profile...
      </p>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!player) {
    return <p>Player not found.</p>;
  }

  const playedGames =
    playerGames.filter(
      (game) =>
        Number(game.spins || 0) > 0 ||
        Number(game.points || 0) > 0
    );

  const sortedByPoints =
    [...playedGames].sort(
      (a, b) =>
        b.points - a.points
    );

  const bestGame =
    sortedByPoints.length > 0
      ? sortedByPoints[0]
      : null;

  const gamesWithPoints =
    playedGames.filter(
      (game) =>
        game.points > 0
    );

  const worstGame =
    gamesWithPoints.length > 0
      ? [...gamesWithPoints].sort(
          (a, b) =>
            a.points - b.points
        )[0]
      : null;

  const totalGamePoints =
    playedGames.reduce(
      (total, game) =>
        total + game.points,
      0
    );

  const totalGameSpins =
    playedGames.reduce(
      (total, game) =>
        total + game.spins,
      0
    );

  const averagePointsPerGame =
    playedGames.length > 0
      ? totalGamePoints /
        playedGames.length
      : 0;

  return (
    <div>
      <button
        onClick={() =>
          navigate("/")
        }
        style={{
          marginBottom: "20px",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1
        style={{
          marginBottom: "6px",
          color: "#ffffff",
        }}
      >
        👤 {player.player}
      </h1>

      <p
        style={{
          color: "#3fb950",
          marginTop: 0,
          marginBottom: "14px",
          fontWeight: "bold",
        }}
      >
        ● LIVE
      </p>

      <button
        onClick={() =>
          navigate(
            `/players/${encodeURIComponent(
              player.player
            )}/schedule`
          )
        }
        style={{
          width: "100%",
          backgroundColor: "#21262d",
          color: "#ffffff",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "20px",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        📅 View My Schedule
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatBox
          label="Standing"
          value={
            player.standings
              ? `#${player.standings}`
              : "-"
          }
        />

        <StatBox
          label="Points"
          value={Number(
            player.points || 0
          ).toLocaleString()}
        />

        <StatBox
          label="Spin Rank"
          value={
            player.spinRank
              ? `#${player.spinRank}`
              : "-"
          }
        />

        <StatBox
          label="Spins"
          value={player.spins || 0}
        />

        <StatBox
          label="SPG"
          value={formatStat(
            player.spinsPerGame
          )}
        />

        <StatBox
          label="PPS"
          value={formatStat(
            player.pointsPerSpin
          )}
        />

        <StatBox
          label="100s"
          value={player.hundreds || 0}
        />

        <StatBox
          label="Year"
          value={player.year || 2026}
        />
      </div>

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "14px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#ffffff",
          }}
        >
          📊 Weekend Summary
        </h2>

        <SummaryRow
          label="Best Game"
          value={
            bestGame
              ? `${bestGame.game} (${bestGame.points} pts)`
              : "-"
          }
        />

        <SummaryRow
          label="Worst Scoring Game"
          value={
            worstGame
              ? `${worstGame.game} (${worstGame.points} pts)`
              : "-"
          }
        />

        <SummaryRow
          label="Game Spins"
          value={totalGameSpins}
        />

        <SummaryRow
          label="Average Points / Game"
          value={
            averagePointsPerGame.toFixed(1)
          }
        />
      </div>

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "14px",
          padding: "18px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#ffffff",
          }}
        >
          🎯 Game Breakdown
        </h2>

        {games.map((game) => {
          const stats =
            playerGames.find(
              (item) =>
                item.game ===
                game.name
            );

          return (
            <div
              key={game.id}
              onClick={() =>
                navigate(`/games/${game.id}`)
              }
              style={{
                padding: "14px 0",
                borderBottom:
                  "1px solid #30363d",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: "12px",
                }}
              >
                <strong
                  style={{
                    color:
                      "#ffffff",
                  }}
                >
                  {game.icon}{" "}
                  {game.name}
                </strong>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#f2cc60",
                    }}
                  >
                    {stats
                      ? `${stats.points.toLocaleString()} pts`
                      : "0 pts"}
                  </strong>

                  <span
                    style={{
                      color: "#8b949e",
                      fontSize: "22px",
                      lineHeight: 1,
                    }}
                  >
                    ›
                  </span>
                </div>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: "16px",
                  marginTop: "6px",
                  color:
                    "#8b949e",
                  fontSize: "13px",
                }}
              >
                <span>
                  🎡{" "}
                  {stats
                    ? stats.spins
                    : 0}{" "}
                  Spins
                </span>

                <span>
                  SV:{" "}
                  {stats
                    ? stats.spinValue
                    : 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        backgroundColor:
          "#21262d",
        border:
          "1px solid #30363d",
        borderRadius: "12px",
        padding: "14px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#8b949e",
          fontSize: "13px",
        }}
      >
        {label}
      </p>

      <h2
        style={{
          margin:
            "6px 0 0 0",
          fontSize: "22px",
          color: "#ffffff",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: "20px",
        padding: "10px 0",
        borderBottom:
          "1px solid #30363d",
      }}
    >
      <span
        style={{
          color: "#8b949e",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          textAlign: "right",
          color: "#ffffff",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatStat(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.000";
  }

  return number.toFixed(3);
}

export default PlayerProfile;