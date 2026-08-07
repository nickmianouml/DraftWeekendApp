import { Link } from "react-router-dom";
import games from "../data/games";

function Games() {
  return (
    <div>
      <h1>🎯 Games</h1>

      {games.map((game) => (
        <Link
          key={game.id}
          to={`/games/${game.id}`}
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              backgroundColor: "#21262d",
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "14px",
              border: "1px solid #30363d",
            }}
          >
            <h2>
              {game.icon} {game.name}
            </h2>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default Games;