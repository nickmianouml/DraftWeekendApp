import {
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { getPlayers } from "../services/players";
import { getLiveData } from "../services/live";
import { getAllPlayerRecords } from "../services/playerRecord";
import { getCurrentGameMatchups } from "../services/currentGame";

import {
  formatAmericanOdds,
  getOdds,
} from "../services/odds";

import {
  getCachedData,
  getCachedValue,
  isCacheFresh,
} from "../utils/dataCache";

import "../styles/standingsPage.css";

const REFRESH_INTERVAL = 30000;

const PLAYERS_CACHE_KEY =
  "standings-players";

const LIVE_CACHE_KEY =
  "standings-live";

const RECORDS_CACHE_KEY =
  "standings-records";

const MATCHUPS_CACHE_KEY =
  "current-game-matchups";

const ODDS_CACHE_KEY =
  "odds";

const UPSET_EXCLUDED_GAMES = [
  "Flip Cup",
  "Baseball",
  "Relay Race",
  "HR Derby",
  "Mouse Trap",
  "Fuck Yeah",
  "Elimination Chamber",
  "Liars Dice",
  "Rock Paper Scissors",
  "Thunderchug",
];

function sortStandings(players) {
  return [...(players || [])].sort(
    (a, b) => {
      if (
        a.standings !==
        b.standings
      ) {
        return (
          a.standings -
          b.standings
        );
      }

      return (
        Number(
          b.points || 0
        ) -
        Number(
          a.points || 0
        )
      );
    }
  );
}

function Standings() {
  /*
   * IMPORTANT:
   *
   * Read each API cache independently.
   *
   * We no longer maintain one giant
   * "Standings View" object that requires
   * every API to succeed before the page
   * can exist.
   */
  const initialPlayers =
    getCachedValue(
      PLAYERS_CACHE_KEY
    ) || [];

  const initialLive =
    getCachedValue(
      LIVE_CACHE_KEY
    ) || null;

  const initialRecords =
    getCachedValue(
      RECORDS_CACHE_KEY
    ) || [];

  const initialMatchups =
    getCachedValue(
      MATCHUPS_CACHE_KEY
    ) || [];

  const initialOdds =
    getCachedValue(
      ODDS_CACHE_KEY
    ) || [];

  const [
    standings,
    setStandings,
  ] = useState(
    sortStandings(
      initialPlayers
    )
  );

  const [live, setLive] =
    useState(
      initialLive
    );

  const [
    records,
    setRecords,
  ] = useState(
    initialRecords
  );

  const [
    largestUpset,
    setLargestUpset,
  ] = useState(() =>
    findLargestUpset(
      initialMatchups,
      initialOdds
    )
  );

  /*
   * The ONLY thing that controls the
   * main loading screen is whether we
   * already have player standings.
   */
  const [
    loading,
    setLoading,
  ] = useState(
    initialPlayers.length ===
      0
  );

  const [error, setError] =
    useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  const mountedRef =
    useRef(true);

  const intervalRef =
    useRef(null);

  const playersRequestRef =
    useRef(false);

  const liveRequestRef =
    useRef(false);

  const recordsRequestRef =
    useRef(false);

  const matchupsRequestRef =
    useRef(false);

  const oddsRequestRef =
    useRef(false);

  /*
   * Keep the latest matchup and odds
   * datasets in refs.
   *
   * This lets either API finish first.
   * Whichever finishes second immediately
   * recalculates Largest Upset.
   */
  const matchupsRef =
    useRef(
      initialMatchups
    );

  const oddsRef =
    useRef(
      initialOdds
    );

  useEffect(() => {
    mountedRef.current =
      true;

    function updateLargestUpset() {
      if (
        !mountedRef.current
      ) {
        return;
      }

      setLargestUpset(
        findLargestUpset(
          matchupsRef.current,
          oddsRef.current
        )
      );
    }

    /*
     * --------------------------------
     * CRITICAL DATA
     * --------------------------------
     *
     * This controls whether the user
     * can actually see the Standings
     * page.
     */
    async function loadPlayers({
      force = false,
      showLoading = false,
    } = {}) {
      if (
        playersRequestRef.current
      ) {
        return;
      }

      playersRequestRef.current =
        true;

      if (
        showLoading &&
        mountedRef.current
      ) {
        setLoading(true);
      }

      try {
        const playersData =
          await getCachedData(
            PLAYERS_CACHE_KEY,
            getPlayers,
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

        const sorted =
          sortStandings(
            playersData
          );

        setStandings(
          sorted
        );

        /*
         * As soon as Players returns,
         * REMOVE THE LOADING SCREEN.
         *
         * We do NOT wait for:
         * - Live
         * - Records
         * - Current Game
         * - Odds
         */
        setLoading(false);

        setLastUpdated(
          new Date()
        );

        setError("");
      } catch (err) {
        console.error(
          "Standings player data error:",
          err
        );

        if (
          mountedRef.current
        ) {
          /*
           * Only show a fatal error if
           * we truly have no standings
           * to display.
           */
          if (
            standings.length ===
            0
          ) {
            setError(
              "Unable to load the live standings."
            );

            setLoading(
              false
            );
          }
        }
      } finally {
        playersRequestRef.current =
          false;
      }
    }

    /*
     * --------------------------------
     * LIVE SUMMARY DATA
     * --------------------------------
     *
     * Luckiest, Unluckiest,
     * Porch Beers, etc.
     *
     * Never blocks the standings.
     */
    async function loadLive({
      force = false,
    } = {}) {
      if (
        liveRequestRef.current
      ) {
        return;
      }

      liveRequestRef.current =
        true;

      try {
        const liveData =
          await getCachedData(
            LIVE_CACHE_KEY,
            getLiveData,
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

        setLive(
          liveData || null
        );
      } catch (err) {
        console.error(
          "Standings live data error:",
          err
        );
      } finally {
        liveRequestRef.current =
          false;
      }
    }

    /*
     * --------------------------------
     * PLAYER W-L RECORDS
     * --------------------------------
     *
     * Completely secondary.
     */
    async function loadRecords({
      force = false,
    } = {}) {
      if (
        recordsRequestRef.current
      ) {
        return;
      }

      recordsRequestRef.current =
        true;

      try {
        const recordsData =
          await getCachedData(
            RECORDS_CACHE_KEY,
            getAllPlayerRecords,
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

        setRecords(
          recordsData || []
        );
      } catch (err) {
        console.error(
          "Standings records error:",
          err
        );
      } finally {
        recordsRequestRef.current =
          false;
      }
    }

    /*
     * --------------------------------
     * CURRENT MATCHUPS
     * --------------------------------
     *
     * Used only by Largest Upset.
     *
     * Never blocks the standings.
     */
    async function loadMatchups({
      force = false,
    } = {}) {
      if (
        matchupsRequestRef.current
      ) {
        return;
      }

      matchupsRequestRef.current =
        true;

      try {
        const matchupData =
          await getCachedData(
            MATCHUPS_CACHE_KEY,
            getCurrentGameMatchups,
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

        matchupsRef.current =
          matchupData || [];

        updateLargestUpset();
      } catch (err) {
        console.error(
          "Standings matchup error:",
          err
        );
      } finally {
        matchupsRequestRef.current =
          false;
      }
    }

    /*
     * --------------------------------
     * ODDS
     * --------------------------------
     *
     * Odds essentially never change,
     * so cache them for the entire
     * app session.
     *
     * This request NEVER blocks the
     * actual standings.
     */
    async function loadOdds() {
      if (
        oddsRequestRef.current
      ) {
        return;
      }

      if (
        isCacheFresh(
          ODDS_CACHE_KEY,
          Infinity
        )
      ) {
        oddsRef.current =
          getCachedValue(
            ODDS_CACHE_KEY
          ) || [];

        updateLargestUpset();

        return;
      }

      oddsRequestRef.current =
        true;

      try {
        const oddsData =
          await getCachedData(
            ODDS_CACHE_KEY,
            getOdds,
            {
              ttl:
                Infinity,
            }
          );

        if (
          !mountedRef.current
        ) {
          return;
        }

        oddsRef.current =
          oddsData || [];

        updateLargestUpset();
      } catch (err) {
        console.error(
          "Standings odds error:",
          err
        );
      } finally {
        oddsRequestRef.current =
          false;
      }
    }

    /*
     * --------------------------------
     * INITIAL LOAD
     * --------------------------------
     *
     * THIS IS THE IMPORTANT CHANGE.
     *
     * We start everything at once,
     * but we DO NOT await everything.
     */
    function initialLoad() {
      /*
       * Players gets absolute priority.
       */
      loadPlayers({
        showLoading:
          initialPlayers.length ===
          0,
      });

      /*
       * Everything below happens
       * independently in the background.
       */
      loadLive();

      loadRecords();

      loadMatchups();

      loadOdds();
    }

    /*
     * --------------------------------
     * BACKGROUND REFRESH
     * --------------------------------
     */
    function refreshAllIfNeeded() {
      if (
        !isCacheFresh(
          PLAYERS_CACHE_KEY,
          REFRESH_INTERVAL
        )
      ) {
        loadPlayers();
      }

      if (
        !isCacheFresh(
          LIVE_CACHE_KEY,
          REFRESH_INTERVAL
        )
      ) {
        loadLive();
      }

      if (
        !isCacheFresh(
          RECORDS_CACHE_KEY,
          REFRESH_INTERVAL
        )
      ) {
        loadRecords();
      }

      if (
        !isCacheFresh(
          MATCHUPS_CACHE_KEY,
          REFRESH_INTERVAL
        )
      ) {
        loadMatchups();
      }

      /*
       * Odds are intentionally NOT
       * refreshed.
       */
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
          refreshAllIfNeeded,
          REFRESH_INTERVAL
        );
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        refreshAllIfNeeded();

        startPolling();
      } else {
        stopPolling();
      }
    }

    initialLoad();

    startPolling();

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mountedRef.current =
        false;

      stopPolling();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /*
   * Only the Players API can keep
   * this screen in loading mode.
   */
  if (loading) {
    return (
      <div className="standings-page">
        <h1
          style={{
            color:
              "#ffffff",
            textAlign:
              "center",
          }}
        >
          🏆 2026 Standings
        </h1>

        <p>
          Loading standings...
        </p>
      </div>
    );
  }

  if (
    error &&
    standings.length === 0
  ) {
    return (
      <div className="standings-page">
        <h1
          style={{
            color:
              "#ffffff",
            textAlign:
              "center",
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
          ...standings.map(
            (player) =>
              Number(
                player.points ||
                  0
              )
          )
        )
      : 0;

  return (
    <div className="standings-page">
      <div
        className="standings-heading"
        style={{
          display:
            "block",
          textAlign:
            "center",
        }}
      >
        <div>
          <h1
            style={{
              color:
                "#ffffff",
              textAlign:
                "center",
              marginBottom:
                "4px",
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
              textAlign:
                "center",
            }}
          >
            Updated{" "}
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
      </div>

      <div className="standings-summary">
        <SummaryTile
          icon="🔥"
          label="Luckiest"
          value={formatPPS(
            live?.[
              "Highest PPS"
            ]
          )}
          showPPS
          detail={
            live?.[
              "Hottest Player"
            ] || ""
          }
        />

        <UpsetTile
          upset={
            largestUpset
          }
        />

        <SummaryTile
          icon="☘️"
          label="Unluckiest"
          value={formatPPS(
            live?.[
              "Lowest PPS"
            ]
          )}
          showPPS
          detail={
            live?.[
              "Unluckiest Player"
            ] || ""
          }
        />

        <SummaryTile
          icon="🍺"
          label="Total Porch Beers"
          value={
            live?.[
              "Total Porch Beers"
            ] || "0"
          }
          detail="Spun"
        />
      </div>

      <div className="standings-list">
        {standings.map(
          (
            player,
            index
          ) => {
            const rank =
              player.standings ||
              index + 1;

            const pointsBehind =
              Math.max(
                0,
                firstPlacePoints -
                  Number(
                    player.points ||
                      0
                  )
              );

            const record =
              findPlayerRecord(
                records,
                player.player
              );

            return (
              <Link
                key={
                  player.player
                }
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
                      {getRankDisplay(
                        rank
                      )}
                    </div>

                    <div
                      className="standing-player"
                      style={{
                        display:
                          "flex",
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
                          color:
                            "#ffffff",
                          fontSize:
                            "20px",
                        }}
                      >
                        {
                          player.player
                        }
                      </strong>

                      <div
                        style={{
                          marginTop:
                            "5px",
                          display:
                            "flex",
                          alignItems:
                            "baseline",
                          justifyContent:
                            "center",
                          gap:
                            "5px",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#f2cc60",
                            fontSize:
                              "22px",
                            lineHeight:
                              1,
                          }}
                        >
                          {Number(
                            player.points ||
                              0
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
                          marginTop:
                            "7px",
                          color:
                            "#8b949e",
                          fontSize:
                            "11px",
                          fontWeight:
                            "bold",
                          textAlign:
                            "center",
                        }}
                      >
                        {
                          record.wins
                        }
                        -
                        {
                          record.losses
                        }
                        {" · "}
                        {formatWinPct(
                          record.winPct
                        )}
                        {" · "}
                        Win Rank #
                        {
                          record.winRank
                        }
                      </div>
                    </div>

                    <div className="standing-arrow">
                      ›
                    </div>
                  </div>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(3, 1fr)",
                      borderTop:
                        "1px solid #30363d",
                    }}
                  >
                    <PlayerStat
                      label="Spins"
                      value={
                        player.spins ||
                        0
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
                      value={
                        pointsBehind
                      }
                      borderRight
                    />

                    <PlayerStat
                      label="100s"
                      value={
                        player.hundreds ||
                        0
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

function UpsetTile({
  upset,
}) {
  if (!upset) {
    return (
      <div className="standings-summary-tile">
        <span className="summary-label">
          😱 Largest Upset
        </span>

        <strong className="summary-value">
          —
        </strong>

        <span className="summary-detail">
          No upsets yet
        </span>
      </div>
    );
  }

  return (
    <div className="standings-summary-tile">
      <span className="summary-label">
        😱 Largest Upset
      </span>

      <div
        style={{
          marginTop:
            "6px",
          textAlign:
            "center",
          lineHeight:
            1.2,
        }}
      >
        <div>
          <strong
            style={{
              color:
                "#58a6ff",
              fontSize:
                "21px",
              marginRight:
                "6px",
            }}
          >
            {formatAmericanOdds(
              upset.odds
            )}
          </strong>

          <strong
            style={{
              color:
                "#3fb950",
              fontSize:
                "13px",
            }}
          >
            {upset.winner}
          </strong>
        </div>

        <div
          style={{
            color:
              "#8b949e",
            fontSize:
              "10px",
            fontWeight:
              "bold",
            margin:
              "3px 0",
            textTransform:
              "uppercase",
          }}
        >
          vs
        </div>

        <div>
          <strong
            style={{
              color:
                "#58a6ff",
              fontSize:
                "14px",
              marginRight:
                "6px",
            }}
          >
            {formatAmericanOdds(
              upset.losingOdds
            )}
          </strong>

          <strong
            style={{
              color:
                "#ffffff",
              fontSize:
                "13px",
            }}
          >
            {upset.loser}
          </strong>
        </div>

        <div
          style={{
            color:
              "#8b949e",
            fontSize:
              "11px",
            marginTop:
              "5px",
          }}
        >
          {upset.game}
        </div>
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
    <div
      className="standings-summary-tile"
      style={{
        display:
          "flex",
        flexDirection:
          "column",
        alignItems:
          "center",
        justifyContent:
          "center",
      }}
    >
      <span
        className="summary-label"
        style={{
          marginBottom:
            "7px",
        }}
      >
        {icon} {label}
      </span>

      {showPPS ? (
        <div
          style={{
            display:
              "flex",
            alignItems:
              "baseline",
            justifyContent:
              "center",
            gap:
              "8px",
          }}
        >
          <strong
            className="summary-value"
            style={{
              fontSize:
                "30px",
              lineHeight:
                1,
            }}
          >
            {value}
          </strong>

          <span
            style={{
              color:
                "#8b949e",
              fontSize:
                "12px",
              fontWeight:
                "bold",
              textTransform:
                "uppercase",
            }}
          >
            PPS
          </span>
        </div>
      ) : (
        <strong
          className="summary-value"
          style={{
            fontSize:
              "30px",
            lineHeight:
              1,
          }}
        >
          {value}
        </strong>
      )}

      <span
        className="summary-detail"
        style={{
          fontSize:
            "14px",
          fontWeight:
            "bold",
          marginTop:
            "9px",
          lineHeight:
            1.1,
        }}
      >
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
        padding:
          "16px 8px",
        textAlign:
          "center",
        borderRight:
          borderRight
            ? "1px solid #30363d"
            : "none",
        borderBottom:
          borderBottom
            ? "1px solid #30363d"
            : "none",
      }}
    >
      <span
        style={{
          display:
            "block",
          color:
            "#8b949e",
          fontSize:
            "11px",
          textTransform:
            "uppercase",
          marginBottom:
            "8px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color:
            "#ffffff",
          fontSize:
            "16px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function normalizeName(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
}

function normalizeGameName(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

function normalizeTeam(
  value
) {
  return String(
    value || ""
  )
    .split(
      /\s*\/\s*|\s*,\s*|\s*&\s*/
    )
    .map(
      normalizeName
    )
    .filter(Boolean)
    .sort()
    .join("|");
}

function isUpsetEligibleGame(
  gameName
) {
  const normalizedGame =
    normalizeGameName(
      gameName
    );

  return !UPSET_EXCLUDED_GAMES.some(
    (
      excludedGame
    ) =>
      normalizeGameName(
        excludedGame
      ) ===
      normalizedGame
  );
}

function findLargestUpset(
  matchups,
  odds
) {
  const candidates = [];

  for (
    const matchup of
    matchups || []
  ) {
    if (
      !isUpsetEligibleGame(
        matchup.game
      )
    ) {
      continue;
    }

    const winnerSide =
      getMatchupWinnerSide(
        matchup.score1,
        matchup.score2
      );

    if (!winnerSide) {
      continue;
    }

    const matchupOdds =
      findOddsForMatchup(
        odds,
        matchup
      );

    if (!matchupOdds) {
      continue;
    }

    const winningOddsRaw =
      winnerSide === 1
        ? matchupOdds.odds1
        : matchupOdds.odds2;

    const winningOdds =
      parseAmericanOdds(
        winningOddsRaw
      );

    if (
      winningOdds ===
        null ||
      winningOdds <= 0
    ) {
      continue;
    }

    candidates.push({
      game:
        matchup.game,

      winner:
        winnerSide === 1
          ? matchup.team1
          : matchup.team2,

      loser:
        winnerSide === 1
          ? matchup.team2
          : matchup.team1,

      odds:
        winningOdds,

      losingOdds:
        winnerSide === 1
          ? matchupOdds.odds2
          : matchupOdds.odds1,
    });
  }

  if (
    candidates.length ===
    0
  ) {
    return null;
  }

  candidates.sort(
    (a, b) =>
      b.odds -
      a.odds
  );

  return candidates[0];
}

function findOddsForMatchup(
  odds,
  matchup
) {
  const targetGame =
    normalizeGameName(
      matchup.game
    );

  const team1 =
    normalizeTeam(
      matchup.team1
    );

  const team2 =
    normalizeTeam(
      matchup.team2
    );

  const gameOdds =
    (odds || []).filter(
      (item) =>
        normalizeGameName(
          item.game
        ) ===
          targetGame &&
        normalizeName(
          item.type
        ) ===
          "matchup"
    );

  const direct =
    gameOdds.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) ===
          team1 &&
        normalizeTeam(
          item.team2
        ) ===
          team2
    );

  if (direct) {
    return {
      odds1:
        direct.odds1,
      odds2:
        direct.odds2,
    };
  }

  const reversed =
    gameOdds.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) ===
          team2 &&
        normalizeTeam(
          item.team2
        ) ===
          team1
    );

  if (reversed) {
    return {
      odds1:
        reversed.odds2,
      odds2:
        reversed.odds1,
    };
  }

  return null;
}

function getMatchupWinnerSide(
  score1,
  score2
) {
  const raw1 =
    String(
      score1 ?? ""
    ).trim();

  const raw2 =
    String(
      score2 ?? ""
    ).trim();

  if (
    !raw1 ||
    !raw2
  ) {
    return null;
  }

  const result1 =
    raw1.toUpperCase();

  const result2 =
    raw2.toUpperCase();

  if (
    result1 === "W"
  ) {
    return 1;
  }

  if (
    result2 === "W"
  ) {
    return 2;
  }

  if (
    result1 === "L" &&
    result2 !== "L"
  ) {
    return 2;
  }

  if (
    result2 === "L" &&
    result1 !== "L"
  ) {
    return 1;
  }

  const number1 =
    Number(raw1);

  const number2 =
    Number(raw2);

  if (
    Number.isNaN(
      number1
    ) ||
    Number.isNaN(
      number2
    ) ||
    number1 ===
      number2
  ) {
    return null;
  }

  return number1 >
    number2
    ? 1
    : 2;
}

function parseAmericanOdds(
  value
) {
  const raw =
    String(
      value ?? ""
    )
      .trim()
      .replace(
        /,/g,
        ""
      );

  if (!raw) {
    return null;
  }

  const number =
    Number(raw);

  if (
    Number.isNaN(
      number
    )
  ) {
    return null;
  }

  return number;
}

function findPlayerRecord(
  records,
  playerName
) {
  return (
    records.find(
      (record) =>
        normalizeName(
          record.player
        ) ===
        normalizeName(
          playerName
        )
    ) || {
      wins: 0,
      losses: 0,
      winPct: 0,
      winRank: 1,
    }
  );
}

function getRankDisplay(
  rank
) {
  if (
    rank === 1
  ) {
    return "🥇";
  }

  if (
    rank === 2
  ) {
    return "🥈";
  }

  if (
    rank === 3
  ) {
    return "🥉";
  }

  return `#${rank}`;
}

function formatStat(
  value
) {
  const number =
    Number(value);

  if (
    Number.isNaN(
      number
    )
  ) {
    return "0.000";
  }

  return number.toFixed(
    3
  );
}

function formatPPS(
  value
) {
  const number =
    Number(value);

  if (
    Number.isNaN(
      number
    )
  ) {
    return "0";
  }

  if (
    Number.isInteger(
      number
    )
  ) {
    return number.toString();
  }

  return number.toFixed(
    3
  );
}

function formatWinPct(
  value
) {
  const number =
    Number(value);

  if (
    Number.isNaN(
      number
    )
  ) {
    return "0.0%";
  }

  return `${(
    number * 100
  ).toFixed(1)}%`;
}

export default Standings;