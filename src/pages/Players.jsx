import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPlayers } from "../services/players";

function Players() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    async function loadPlayers() {
      const data = await getPlayers();
      setPlayers(data);
    }

    loadPlayers();
  }, []);

  return (
    <div>
      <h1>👥 Players</h1>

      {players.length === 0 ? (
        <p>Loading players...</p>
      ) : (
        players.map((player) => (
          <Link
            key={player.player}
            to={`/players/${encodeURIComponent(player.player)}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                backgroundColor: "#21262d",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
                border: "1px solid #30363d",
              }}
            >
              <h2
                style={{
                  margin: "0 0 12px 0",
                  color: "white",
                }}
              >
                {player.player}
              </h2>

              <p style={{ margin: "4px 0", color: "#c9d1d9" }}>
                🏆 Standing: {player.standings}
              </p>

              <p style={{ margin: "4px 0", color: "#c9d1d9" }}>
                ⭐ Points: {player.points.toLocaleString()}
              </p>

              <p style={{ margin: "4px 0", color: "#c9d1d9" }}>
                🎲 Spins: {player.spins}
              </p>

              <p style={{ margin: "4px 0", color: "#c9d1d9" }}>
                📈 Points/Spin: {player.pointsPerSpin}
              </p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

export default Players;