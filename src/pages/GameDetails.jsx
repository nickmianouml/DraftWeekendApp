import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import games from "../data/games";
import { getGameData } from "../services/games";

function GameDetails() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setLoading(true);
        setError("");

        const data = await getGameData(gameName);

        setGameData(data);
      } catch (err) {
        console.error("Game data error:", err);
        setError("Unable to load game data.");
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, [gameName]);

  if (!game) {
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

        <h1>Game Not Found</h1>

        <p>The selected game could not be found.</p>
      </div>
    );
  }

  if (loading) {
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

        <h1>
          {gameIcon} {gameName}
        </h1>

        <p>{error}</p>
      </div>
    );
  }

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
          marginBottom: "20px",
        }}
      >
        {gameIcon} {gameName}
      </h1>

      {gameData.length === 0 ? (
        <p>No live data available for this game yet.</p>
      ) : (
        gameData.map((player, index) => (
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
                marginBottom: "10px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                #{index + 1} {player.player}
              </h2>

              <strong
                style={{
                  color: "gold",
                  fontSize: "18px",
                }}
              >
                {player.points.toLocaleString()} pts
              </strong>
            </div>

            <p
              style={{
                margin: "4px 0",
              }}
            >
              🎲 Spins: {player.spins}
            </p>

            <p
              style={{
                margin: "4px 0",
              }}
            >
              🎯 Spin Value: {player.spinValue}
            </p>

            <p
              style={{
                margin: "4px 0",
              }}
            >
              ⭐ Points: {player.points.toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default GameDetails;