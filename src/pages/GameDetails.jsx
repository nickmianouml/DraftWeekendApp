import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import games from "../data/games";
import { getGameData } from "../services/games";
import { getMatchupsForGame } from "../services/currentGame";

function GameDetails() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [gameData, setGameData] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const game = games.find((item) => item.id === gameId);

  const gameName = game ? game.name : "";
  const gameIcon = game ? game.icon : "";

  useEffect(() => {
    async function loadGame() {
      if (!gameName) {
        setError("Game not found.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const [statsData, matchupData] = await Promise.all([
          getGameData(gameName),
          getMatchupsForGame(gameName),
        ]);

        setGameData(statsData);
        setMatchups(matchupData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Game details error:", err);
        setError("Unable to load game data.");
      } finally {
        setLoading(false);
      }
    }

    loadGame();

    const interval = setInterval(loadGame, 10000);

    return () => clearInterval(interval);
  }, [gameName]);

  function getStatusDisplay(status) {
    const normalized = String(status || "")
      .trim()
      .toLowerCase();

    if (normalized === "in progress") {
      return {
        text: "● LIVE",
        color: "#3fb950",
      };
    }

    if (normalized === "complete") {
      return {
        text: "✓ Complete",
        color: "#8b949e",
      };
    }

    return {
      text: "Not Started",
      color: "#8b949e",
    };
  }

  if (!game) {
    return (
      <div>
        <button onClick={() => navigate("/games")}>
          ← Back
        </button>

        <h1>Game Not Found</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1>
          {gameIcon} {gameName}
        </h1>

        <p>Loading game data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button onClick={() => navigate("/games")}>
          ← Back
        </button>

        <h1>
          {gameIcon} {gameName}
        </h1>

        <p>{error}</p>
      </div>
    );
  }

  const gameStatus =
    matchups.length > 0
      ? getStatusDisplay(matchups[0].status)
      : getStatusDisplay("");

  return (
    <div>
      <button
        onClick={() => navigate("/games")}
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
        }}
      >
        {gameIcon} {gameName}
      </h1>

      <p
        style={{
          color: gameStatus.color,
          fontWeight: "bold",
          marginTop: "0",
          marginBottom: "6px",
        }}
      >
        {gameStatus.text}
      </p>

      {lastUpdated && (
        <p
          style={{
            color: "#8b949e",
            fontSize: "13px",
            marginTop: 0,
            marginBottom: "20px",
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

      {matchups.length > 0 && (
        <div
          style={{
            backgroundColor: "#161b22",
            border:
              gameStatus.text === "● LIVE"
                ? "1px solid #3fb950"
                : "1px solid #30363d",
            borderRadius: "16px",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            🤝 Matchups
          </h2>

          {matchups.map((matchup, index) => {
            const matchupStatus =
              getStatusDisplay(matchup.status);

            return (
              <div
                key={`${matchup.team1}-${matchup.team2}-${index}`}
                style={{
                  backgroundColor: "#21262d",
                  borderRadius: "14px",
                  padding: "16px",
                  marginBottom:
                    index === matchups.length - 1
                      ? "0"
                      : "12px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 70px 1fr",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "16px",
                      }}
                    >
                      {matchup.team1}
                    </strong>

                    <div
                      style={{
                        fontSize: "28px",
                        marginTop: "4px",
                      }}
                    >
                      {matchup.score1 || "-"}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <strong
                      style={{
                        color: "#8b949e",
                      }}
                    >
                      VS
                    </strong>

                    <div
                      style={{
                        marginTop: "18px",
                        color: matchupStatus.color,
                        fontSize: "12px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {matchupStatus.text}
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <strong
                      style={{
                        display: "block",
                        fontSize: "16px",
                      }}
                    >
                      {matchup.team2}
                    </strong>

                    <div
                      style={{
                        fontSize: "28px",
                        marginTop: "4px",
                      }}
                    >
                      {matchup.score2 || "-"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2>🏆 Game Leaderboard</h2>

      {gameData.length === 0 ? (
        <p>No player data available yet.</p>
      ) : (
        gameData.map((player, index) => {
          let rank = `#${index + 1}`;

          if (index === 0) {
            rank = "🥇";
          }

          if (index === 1) {
            rank = "🥈";
          }

          if (index === 2) {
            rank = "🥉";
          }

          return (
            <div
              key={player.player}
              style={{
                backgroundColor: "#21262d",
                border: "1px solid #30363d",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <strong
                  style={{
                    fontSize: "18px",
                  }}
                >
                  {rank} {player.player}
                </strong>

                <strong
                  style={{
                    color: "#f2cc60",
                  }}
                >
                  {player.points.toLocaleString()} pts
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#8b949e",
                  fontSize: "14px",
                }}
              >
                <span>
                  🎲 {player.spins} Spins
                </span>

                <span>
                  SV: {player.spinValue}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default GameDetails;