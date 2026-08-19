import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import games from "../data/games";
import { getGameStatuses } from "../services/gameStatus";

import {
  getCachedData,
  getCachedValue,
  isCacheFresh,
} from "../utils/dataCache";

import "../styles/games.css";

const REFRESH_INTERVAL = 30000;

const GAME_STATUS_CACHE_KEY =
  "game-statuses";

const GAMES_VIEW_CACHE_KEY =
  "games-view";

function getSavedGamesView() {
  return getCachedValue(
    GAMES_VIEW_CACHE_KEY
  );
}

function Games() {
  const savedView =
    getSavedGamesView();

  const [
    statuses,
    setStatuses,
  ] = useState(
    savedView?.statuses || []
  );

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(
    savedView?.lastUpdated
      ? new Date(
          savedView.lastUpdated
        )
      : null
  );

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(
      !savedView
    );

  const mountedRef =
    useRef(true);

  const intervalRef =
    useRef(null);

  const requestInFlightRef =
    useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    function saveView(
      nextStatuses,
      nextUpdated
    ) {
      /*
       * Store the actual rendered page state
       * in the same shared cache module.
       */
      getCachedData(
        GAMES_VIEW_CACHE_KEY,
        async () => ({
          statuses:
            nextStatuses,
          lastUpdated:
            nextUpdated.toISOString(),
        }),
        {
          ttl: Infinity,
          force: true,
        }
      ).catch(
        (cacheError) => {
          console.error(
            "Games view cache error:",
            cacheError
          );
        }
      );
    }

    async function loadStatuses({
      showLoading = false,
      force = false,
    } = {}) {
      if (
        requestInFlightRef.current
      ) {
        return;
      }

      requestInFlightRef.current =
        true;

      if (
        showLoading &&
        mountedRef.current
      ) {
        setLoading(true);
      }

      try {
        const data =
          await getCachedData(
            GAME_STATUS_CACHE_KEY,
            getGameStatuses,
            {
              ttl:
                REFRESH_INTERVAL,
              force,
            }
          );

        if (
          !mountedRef.current
        ) {
          return;
        }

        const nextStatuses =
          data || [];

        const now =
          new Date();

        setStatuses(
          (previous) => {
            const previousJson =
              JSON.stringify(
                previous
              );

            const nextJson =
              JSON.stringify(
                nextStatuses
              );

            if (
              previousJson ===
              nextJson
            ) {
              return previous;
            }

            return nextStatuses;
          }
        );

        setLastUpdated(now);

        saveView(
          nextStatuses,
          now
        );

        setError("");
      } catch (err) {
        console.error(
          "Game status error:",
          err
        );

        if (
          mountedRef.current
        ) {
          /*
           * If we already have cached data,
           * keep it on screen instead of
           * replacing the whole page with
           * an error state.
           */
          if (
            statuses.length === 0
          ) {
            setError(
              "Unable to load live game statuses."
            );
          }
        }
      } finally {
        requestInFlightRef.current =
          false;

        if (
          mountedRef.current &&
          showLoading
        ) {
          setLoading(false);
        }
      }
    }

    function stopPolling() {
      if (
        intervalRef.current
      ) {
        clearInterval(
          intervalRef.current
        );

        intervalRef.current =
          null;
      }
    }

    function refreshIfStale() {
      if (
        !isCacheFresh(
          GAME_STATUS_CACHE_KEY,
          REFRESH_INTERVAL
        )
      ) {
        loadStatuses();
      }
    }

    function startPolling() {
      stopPolling();

      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      intervalRef.current =
        setInterval(
          refreshIfStale,
          REFRESH_INTERVAL
        );
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshIfStale();
        startPolling();
      } else {
        stopPolling();
      }
    }

    /*
     * If the page already has cached data,
     * render it immediately.
     *
     * Only go to the network if the shared
     * game-status cache has expired.
     */
    if (
      savedView
    ) {
      setLoading(false);

      refreshIfStale();
    } else {
      loadStatuses({
        showLoading: true,
      });
    }

    startPolling();

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

  /*
   * Keep the large GameDetails chunk warm
   * while the user is looking at Games.
   */
  useEffect(() => {
    let cancelled = false;

    function prefetchGameDetails() {
      if (cancelled) {
        return;
      }

      import(
        "./GameDetails"
      ).catch(
        (err) => {
          console.error(
            "Game Details preload error:",
            err
          );
        }
      );
    }

    let idleId = null;
    let timeoutId = null;

    if (
      typeof window !==
        "undefined" &&
      "requestIdleCallback" in
        window
    ) {
      idleId =
        window.requestIdleCallback(
          prefetchGameDetails,
          {
            timeout: 1500,
          }
        );
    } else {
      timeoutId =
        window.setTimeout(
          prefetchGameDetails,
          500
        );
    }

    return () => {
      cancelled = true;

      if (
        idleId !== null &&
        "cancelIdleCallback" in
          window
      ) {
        window.cancelIdleCallback(
          idleId
        );
      }

      if (
        timeoutId !== null
      ) {
        window.clearTimeout(
          timeoutId
        );
      }
    };
  }, []);

  function normalizeText(
    value
  ) {
    return String(
      value || ""
    )
      .trim()
      .toLowerCase();
  }

  function getStatus(
    gameName
  ) {
    const normalizedGameName =
      normalizeText(
        gameName
      );

    const match =
      statuses.find(
        (item) =>
          normalizeText(
            item.game
          ) ===
          normalizedGameName
      );

    if (!match) {
      return "Not Started";
    }

    const normalizedStatus =
      normalizeText(
        match.status
      );

    if (
      normalizedStatus ===
      "in progress"
    ) {
      return "In Progress";
    }

    if (
      normalizedStatus ===
      "complete"
    ) {
      return "Complete";
    }

    return "Not Started";
  }

  function getCardClass(
    status
  ) {
    if (
      status ===
      "In Progress"
    ) {
      return "game-card game-card-live";
    }

    if (
      status ===
      "Complete"
    ) {
      return "game-card game-card-complete";
    }

    return "game-card";
  }

  function getStatusClass(
    status
  ) {
    if (
      status ===
      "In Progress"
    ) {
      return "game-status game-status-live";
    }

    if (
      status ===
      "Complete"
    ) {
      return "game-status game-status-complete";
    }

    return "game-status game-status-not-started";
  }

  function getStatusText(
    status
  ) {
    if (
      status ===
      "In Progress"
    ) {
      return "● LIVE";
    }

    if (
      status ===
      "Complete"
    ) {
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

      {!loading &&
        lastUpdated && (
          <p className="games-refresh">
            Live status refreshed{" "}
            {lastUpdated.toLocaleTimeString(
              [],
              {
                hour:
                  "numeric",
                minute:
                  "2-digit",
                second:
                  "2-digit",
              }
            )}
          </p>
        )}

      {error && (
        <p>{error}</p>
      )}

      {games.map(
        (game) => {
          const status =
            getStatus(
              game.name
            );

          return (
            <Link
              key={game.id}
              to={`/games/${game.id}`}
              className="game-link"
            >
              <div
                className={getCardClass(
                  status
                )}
              >
                <div className="game-info">
                  <span className="game-icon">
                    {game.icon}
                  </span>

                  <h2
                    className="game-name"
                    style={{
                      color:
                        "#ffffff",
                    }}
                  >
                    {game.name}
                  </h2>
                </div>

                <span
                  className={getStatusClass(
                    status
                  )}
                >
                  {getStatusText(
                    status
                  )}
                </span>
              </div>
            </Link>
          );
        }
      )}
    </div>
  );
}

export default Games;