import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getPlayers } from "../services/players";
import { getLiveData } from "../services/live";
import { getAllPlayerRecords } from "../services/playerRecord";
import { getCurrentGameMatchups } from "../services/currentGame";
import {
  formatAmericanOdds,
  getOdds,
} from "../services/odds";

import "../styles/standingsPage.css";

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

const REFRESH_INTERVAL = 30000;

function Standings() {
  const [standings, setStandings] = useState([]);
  const [live, setLive] = useState(null);
  const [records, setRecords] = useState([]);
  const [largestUpset, setLargestUpset] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const oddsRef = useRef([]);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  const standingsSnapshotRef = useRef("");
  const liveSnapshotRef = useRef("");
  const recordsSnapshotRef = useRef("");
  const upsetSnapshotRef = useRef("");

  useEffect(() => {
    mountedRef.current = true;

    async function loadOddsOnce() {
      try {
        const oddsData = await getOdds();

        if (!mountedRef.current) {
          return;
        }

        oddsRef.current = oddsData || [];
      } catch (err) {
        console.error(
          "Standings odds load error:",
          err
        );

        oddsRef.current = [];
      }
    }

    async function loadStandings({
      showLoading = false,
    } = {}) {
      if (showLoading) {
        setLoading(true);
      }

      try {
        const [
          playersResult,
          liveResult,
          recordsResult,
          matchupsResult,
        ] = await Promise.allSettled([
          getPlayers(),
          getLiveData(),
          getAllPlayerRecords(),
          getCurrentGameMatchups(),
        ]);

        if (!mountedRef.current) {
          return;
        }

        if (
          playersResult.status ===
          "rejected"
        ) {
          throw playersResult.reason;
        }

        const playersData =
          playersResult.value || [];

        const liveData =
          liveResult.status ===
          "fulfilled"
            ? liveResult.value
            : null;

        const recordsData =
          recordsResult.status ===
          "fulfilled"
            ? recordsResult.value
            : [];

        const matchupData =
          matchupsResult.status ===
          "fulfilled"
            ? matchupsResult.value
            : [];

        if (
          liveResult.status ===
          "rejected"
        ) {
          console.error(
            "Standings live data error:",
            liveResult.reason
          );
        }

        if (
          recordsResult.status ===
          "rejected"
        ) {
          console.error(
            "Standings record data error:",
            recordsResult.reason
          );
        }

        if (
          matchupsResult.status ===
          "rejected"
        ) {
          console.error(
            "Standings matchup data error:",
            matchupsResult.reason
          );
        }

        const sortedStandings =
          [...playersData].sort(
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

        const upset =
          findLargestUpset(
            matchupData,
            oddsRef.current
          );

        const newStandingsSnapshot =
          JSON.stringify(
            sortedStandings
          );

        if (
          newStandingsSnapshot !==
          standingsSnapshotRef.current
        ) {
          standingsSnapshotRef.current =
            newStandingsSnapshot;

          setStandings(
            sortedStandings
          );
        }

        const newLiveSnapshot =
          JSON.stringify(
            liveData
          );

        if (
          newLiveSnapshot !==
          liveSnapshotRef.current
        ) {
          liveSnapshotRef.current =
            newLiveSnapshot;

          setLive(liveData);
        }

        const newRecordsSnapshot =
          JSON.stringify(
            recordsData
          );

        if (
          newRecordsSnapshot !==
          recordsSnapshotRef.current
        ) {
          recordsSnapshotRef.current =
            newRecordsSnapshot;

          setRecords(
            recordsData
          );
        }

        const newUpsetSnapshot =
          JSON.stringify(
            upset
          );

        if (
          newUpsetSnapshot !==
          upsetSnapshotRef.current
        ) {
          upsetSnapshotRef.current =
            newUpsetSnapshot;

          setLargestUpset(
            upset
          );
        }

        setLastUpdated(
          new Date()
        );

        setError("");
      } catch (err) {
        console.error(
          "Standings page error:",
          err
        );

        if (
          mountedRef.current
        ) {
          setError(
            "Unable to load the live standings."
          );
        }
      } finally {
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
          () => {
            loadStandings();
          },
          REFRESH_INTERVAL
        );
    }

    async function initialLoad() {
      await loadOddsOnce();

      if (!mountedRef.current) {
        return;
      }

      await loadStandings({
        showLoading: true,
      });

      if (!mountedRef.current) {
        return;
      }

      startPolling();
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadStandings();
        startPolling();
      } else {
        stopPolling();
      }
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

  if (loading) {
    return (
      <div className="standings-page">
        <h1
          style={{
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          🏆 2026 Standings
        </h1>

        <p>Loading standings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="standings-page">
        <h1
          style={{
            color: "#ffffff",
            textAlign: "center",
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
                player.points || 0
              )
          )
        )
      : 0;

  return (
    <div className="standings-page">
      <div
        className="standings-heading"
        style={{
          display: "block",
          textAlign: "center",
        }}
      >
        <div>
          <h1
            style={{
              color: "#ffffff",
              textAlign: "center",
              marginBottom: "4px",
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
              textAlign: "center",
            }}
          >
            Updated{" "}
            {lastUpdated.toLocaleTimeString(
              [],
              {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
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
            live?.["Highest PPS"]
          )}
          showPPS
          detail={
            live?.[
              "Hottest Player"
            ] || ""
          }
        />

        <UpsetTile
          upset={largestUpset}
        />

        <SummaryTile
          icon="☘️"
          label="Unluckiest"
          value={formatPPS(
            live?.["Lowest PPS"]
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
          (player, index) => {
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
                          gap: "5px",
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
          marginTop: "6px",
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        <div>
          <strong
            style={{
              color: "#58a6ff",
              fontSize: "21px",
              marginRight: "6px",
            }}
          >
            {formatAmericanOdds(
              upset.odds
            )}
          </strong>

          <strong
            style={{
              color: "#3fb950",
              fontSize: "13px",
            }}
          >
            {upset.winner}
          </strong>
        </div>

        <div
          style={{
            color: "#8b949e",
            fontSize: "10px",
            fontWeight: "bold",
            margin: "3px 0",
            textTransform:
              "uppercase",
          }}
        >
          vs
        </div>

        <div>
          <strong
            style={{
              color: "#58a6ff",
              fontSize: "14px",
              marginRight: "6px",
            }}
          >
            {formatAmericanOdds(
              upset.losingOdds
            )}
          </strong>

          <strong
            style={{
              color: "#ffffff",
              fontSize: "13px",
            }}
          >
            {upset.loser}
          </strong>
        </div>

        <div
          style={{
            color: "#8b949e",
            fontSize: "11px",
            marginTop: "5px",
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        className="summary-label"
        style={{
          marginBottom: "7px",
        }}
      >
        {icon} {label}
      </span>

      {showPPS ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <strong
            className="summary-value"
            style={{
              fontSize: "30px",
              lineHeight: 1,
            }}
          >
            {value}
          </strong>

          <span
            style={{
              color: "#8b949e",
              fontSize: "12px",
              fontWeight: "bold",
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
            fontSize: "30px",
            lineHeight: 1,
          }}
        >
          {value}
        </strong>
      )}

      <span
        className="summary-detail"
        style={{
          fontSize: "14px",
          fontWeight: "bold",
          marginTop: "9px",
          lineHeight: 1.1,
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
        padding: "16px 8px",
        textAlign: "center",
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
          display: "block",
          color: "#8b949e",
          fontSize: "11px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#ffffff",
          fontSize: "16px",
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
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeGameName(
  value
) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeTeam(
  value
) {
  return String(value || "")
    .split(
      /\s*\/\s*|\s*,\s*|\s*&\s*/
    )
    .map(normalizeName)
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
    (excludedGame) =>
      normalizeGameName(
        excludedGame
      ) === normalizedGame
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
      winningOdds === null ||
      winningOdds <= 0
    ) {
      continue;
    }

    candidates.push({
      game: matchup.game,

      winner:
        winnerSide === 1
          ? matchup.team1
          : matchup.team2,

      loser:
        winnerSide === 1
          ? matchup.team2
          : matchup.team1,

      odds: winningOdds,

      losingOdds:
        winnerSide === 1
          ? matchupOdds.odds2
          : matchupOdds.odds1,
    });
  }

  if (
    candidates.length === 0
  ) {
    return null;
  }

  candidates.sort(
    (a, b) =>
      b.odds - a.odds
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
        ) === targetGame &&
        normalizeName(
          item.type
        ) === "matchup"
    );

  const direct =
    gameOdds.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) === team1 &&
        normalizeTeam(
          item.team2
        ) === team2
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
        ) === team2 &&
        normalizeTeam(
          item.team2
        ) === team1
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

  if (!raw1 || !raw2) {
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
    number1 === number2
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
      .replace(/,/g, "");

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
  if (rank === 1) {
    return "🥇";
  }

  if (rank === 2) {
    return "🥈";
  }

  if (rank === 3) {
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