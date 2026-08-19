import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import games from "../data/games";
import { getGameStatuses } from "../services/gameStatus";

import "../styles/games.css";

const REFRESH_INTERVAL = 30000;

function Games() {
  const [statuses, setStatuses] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const intervalRef = useRef(null);
  const statusesSnapshotRef = useRef("");

  useEffect(() => {
    mountedRef.current = true;

    async function loadStatuses({
      showLoading = false,
    } = {}) {
      if (showLoading && mountedRef.current) {
        setLoading(true);
      }

      try {
        const data = await getGameStatuses();

        if (!mountedRef.current) {
          return;
        }

        const nextStatuses = data || [];
        const nextSnapshot = JSON.stringify(nextStatuses);

        /*
         * Only update React state if the actual game-status
         * data changed.
         *
         * This prevents every poll from rerendering all of
         * the game cards when the spreadsheet is unchanged.
         */
        if (
          nextSnapshot !== statusesSnapshotRef.current
        ) {
          statusesSnapshotRef.current = nextSnapshot;
          setStatuses(nextStatuses);
        }

        setLastUpdated(new Date());
        setError("");
      } catch (err) {
        console.error("Game status error:", err);

        if (mountedRef.current) {
          setError(
            "Unable to load live game statuses."
          );
        }
      } finally {
        if (mountedRef.current && showLoading) {
          setLoading(false);
        }
      }
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function startPolling() {
      stopPolling();

      /*
       * Don't start an interval while the page/app
       * is in the background.
       */
      if (document.visibilityState !== "visible") {
        return;
      }

      intervalRef.current = setInterval(() => {
        loadStatuses();
      }, REFRESH_INTERVAL);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        /*
         * The user returned to the app/page.
         * Refresh immediately instead of waiting up
         * to 30 seconds for the next interval.
         */
        loadStatuses();

        startPolling();
      } else {
        /*
         * Particularly useful on iOS:
         * stop all polling while the app is hidden.
         */
        stopPolling();
      }
    }

    async function initialLoad() {
      await loadStatuses({
        showLoading: true,
      });

      if (!mountedRef.current) {
        return;
      }

      startPolling();
    }

    initialLoad();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mountedRef.current = false;

      stopPolling();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function getStatus(gameName) {
    const normalizedGameName =
      normalizeText(gameName);

    const match = statuses.find(
      (item) =>
        normalizeText(item.game) ===
        normalizedGameName
    );

    if (!match) {
      return "Not Started";
    }

    const normalizedStatus =
      normalizeText(match.status);

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