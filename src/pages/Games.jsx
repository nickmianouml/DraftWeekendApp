import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import games from "../data/games";
import { getGameStatuses } from "../services/gameStatus";

import "../styles/games.css";

function Games() {
  const [statuses, setStatuses] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatuses() {
      try {
        setError("");

        const data = await getGameStatuses();

        console.log("Statuses received by Games.jsx:", data);

        setStatuses(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Game status error:", err);
        setError("Unable to load live game statuses.");
      } finally {
        setLoading(false);
      }
    }

    loadStatuses();

    const interval = setInterval(loadStatuses, 10000);

    return () => clearInterval(interval);
  }, []);

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function getStatus(gameName) {
    const normalizedGameName = normalizeText(gameName);

    const match = statuses.find(
      (item) =>
        normalizeText(item.game) === normalizedGameName
    );

    if (!match) {
      return "Not Started";
    }

    const normalizedStatus = normalizeText(match.status);

    if (normalizedStatus === "in progress") {
      return "In Progress";
    }

    if (normalizedStatus === "complete") {
      return "Complete";
    }

    return "Not Started";
  }

  function getCardClass(status) {
    if (status === "In Progress") {
      return "game-card game-card-live";
    }

    if (status === "Complete") {
      return "game-card game-card-complete";
    }

    return "game-card";
  }

  function getStatusClass(status) {
    if (status === "In Progress") {
      return "game-status game-status-live";
    }

    if (status === "Complete") {
      return "game-status game-status-complete";
    }

    return "game-status game-status-not-started";
  }

  function getStatusText(status) {
    if (status === "In Progress") {
      return "● LIVE";
    }

    if (status === "Complete") {
      return "✓ Complete";
    }

    return "Not Started";
  }

  return (
    <div className="games-page">
      <h1
        className="games-title"
        style={{
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        🎯 Games
      </h1>

      {loading && (
        <p className="games-refresh">
          Loading live game statuses...
        </p>
      )}

      {!loading && lastUpdated && (
        <p className="games-refresh">
          Live status refreshed{" "}
          {lastUpdated.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}
        </p>
      )}

      {error && (
        <p>
          {error}
        </p>
      )}

      {games.map((game) => {
        const status = getStatus(game.name);

        return (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="game-link"
          >
            <div className={getCardClass(status)}>
              <div className="game-info">
                <span className="game-icon">
                  {game.icon}
                </span>

                <h2
                  className="game-name"
                  style={{
                    color: "#ffffff",
                  }}
                >
                  {game.name}
                </h2>
              </div>

              <span className={getStatusClass(status)}>
                {getStatusText(status)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default Games;