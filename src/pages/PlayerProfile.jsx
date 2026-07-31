import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlayer } from "../services/players";

function PlayerProfile() {
  const { playerName } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);

  useEffect(() => {
    async function loadPlayer() {
      const data = await getPlayer(playerName);
      setPlayer(data);
    }

    loadPlayer();
  }, [playerName]);

  if (!player) {
    return <p>Loading player...</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate("/players")}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1>{player.player}</h1>

      <div
        style={{
          backgroundColor: "#21262d",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h2>Current Weekend</h2>

        <p><strong>🏆 Standing:</strong> {player.standings}</p>

        <p><strong>⭐ Points:</strong> {player.points.toLocaleString()}</p>

        <p><strong>🎲 Spins:</strong> {player.spins}</p>

        <p><strong>🎯 Spin Rank:</strong> {player.spinRank}</p>

        <p><strong>📈 Points / Spin:</strong> {player.pointsPerSpin}</p>

        <p><strong>💯 100 Point Spins:</strong> {player.hundreds}</p>
      </div>
    </div>
  );
}

export default PlayerProfile;