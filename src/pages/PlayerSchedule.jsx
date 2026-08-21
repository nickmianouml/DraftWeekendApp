import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import games from "../data/games";

import { getCurrentGameMatchups } from "../services/currentGame";
import { getPlacements } from "../services/placements";
import { getCaptainGames } from "../services/captains";
import { getGameExtras } from "../services/gameExtras";
import {
  formatAmericanOdds,
  getCaptainOdds,
  getMatchupOdds,
  getOdds,
  getOutrightOdds,
  hasValidLiarsDiceOdds,
} from "../services/odds";

import {
  getCachedData,
  getCachedValue,
  isCacheFresh,
  setCachedData,
} from "../utils/dataCache";

const REFRESH_INTERVAL = 30000;
const REQUEST_TIMEOUT = 10000;

const MATCHUPS_CACHE_KEY =
  "current-game-matchups";

const PLACEMENTS_CACHE_KEY =
  "placements-all";

const CAPTAINS_CACHE_KEY =
  "captain-games-all";

const EXTRAS_CACHE_KEY =
  "game-extras-all";

const ODDS_CACHE_KEY =
  "odds";

const placementGames = [
  "Fuck Yeah",
  "Mouse Trap",
  "Liars Dice",
];

const captainGames = [
  "Flip Cup",
  "Baseball",
  "Relay Race",
  "HR Derby",
];

const excludedScheduleGames = new Set([
  "Thunderchug",
  "Unluckiest",
]);

const scheduleGames = games.filter(
  (game) =>
    !excludedScheduleGames.has(
      game.name
    )
);

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function teamIncludesPlayer(team, playerName) {
  const normalizedPlayer =
    normalizeName(playerName);

  if (!normalizedPlayer) {
    return false;
  }

  return String(team || "")
    .split(/\s*\/\s*|\s*,\s*|\s*&\s*/)
    .map(normalizeName)
    .includes(normalizedPlayer);
}

function formatScore(score1, score2) {
  const left =
    String(score1 ?? "").trim();

  const right =
    String(score2 ?? "").trim();

  if (!left && !right) {
    return "Score: TBD";
  }

  return `Score: ${left || "-"} - ${right || "-"}`;
}

function getWinnerSide(score1, score2) {
  const left =
    String(score1 ?? "")
      .trim()
      .toUpperCase();

  const right =
    String(score2 ?? "")
      .trim()
      .toUpperCase();

  if (!left || !right) {
    return null;
  }

  /*
    Explicit W always wins.

    This handles:
    W / L
    W / 2 left
    1 left / W
  */
  if (left === "W") {
    return "own";
  }

  if (right === "W") {
    return "opponent";
  }

  if (
    left === "L" &&
    right !== "L"
  ) {
    return "opponent";
  }

  if (
    right === "L" &&
    left !== "L"
  ) {
    return "own";
  }

  /*
    Normal games still use
    numeric scores.
  */
  const leftNumber =
    Number(left);

  const rightNumber =
    Number(right);

  if (
    Number.isNaN(leftNumber) ||
    Number.isNaN(rightNumber) ||
    leftNumber === rightNumber
  ) {
    return null;
  }

  if (
    leftNumber >
    rightNumber
  ) {
    return "own";
  }

  return "opponent";
}

function PlayerSchedule() {
  const { playerName } =
    useParams();

  const navigate =
    useNavigate();

  const decodedPlayerName =
    decodeURIComponent(
      playerName || ""
    );

  const scheduleCacheKey =
    `player-schedule:${normalizeName(
      decodedPlayerName
    )}`;

  const initialSchedule =
    getCachedValue(
      scheduleCacheKey
    ) || [];

  const [
    schedule,
    setSchedule,
  ] = useState(
    initialSchedule
  );

  const [
    loading,
    setLoading,
  ] = useState(
    initialSchedule.length ===
      0
  );

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;
    let requestInFlight = false;
    let oddsRequestInFlight = false;

    let latestMatchups =
      getCachedValue(
        MATCHUPS_CACHE_KEY
      ) || [];

    let latestPlacements =
      getCachedValue(
        PLACEMENTS_CACHE_KEY
      ) || [];

    let latestCaptainGames =
      getCachedValue(
        CAPTAINS_CACHE_KEY
      ) || [];

    let latestExtras =
      getCachedValue(
        EXTRAS_CACHE_KEY
      ) || [];

    let latestOdds =
      getCachedValue(
        ODDS_CACHE_KEY
      ) || [];

    function buildSchedule(
      allMatchups,
      allPlacements,
      allCaptainGames,
      allExtras,
      allOdds
    ) {
      return scheduleGames.map(
        (game) => {
          if (
            captainGames.includes(
              game.name
            )
          ) {
            const captainGame =
              (
                allCaptainGames ||
                []
              ).find(
                (item) =>
                  normalizeName(
                    item.game
                  ) ===
                  normalizeName(
                    game.name
                  )
              ) || null;

            return buildCaptainScheduleItem(
              game,
              captainGame,
              decodedPlayerName,
              allOdds
            );
          }

          if (
            placementGames.includes(
              game.name
            )
          ) {
            const placements =
              (
                allPlacements ||
                []
              ).filter(
                (item) =>
                  normalizeName(
                    item.game
                  ) ===
                  normalizeName(
                    game.name
                  )
              );

            return buildPlacementScheduleItem(
              game,
              placements,
              decodedPlayerName,
              allOdds
            );
          }

          if (
            game.name ===
            "Elimination Chamber"
          ) {
            const extras =
              (
                allExtras ||
                []
              ).filter(
                (item) =>
                  normalizeName(
                    item.game
                  ) ===
                  normalizeName(
                    game.name
                  )
              );

            return buildEliminationScheduleItem(
              game,
              extras,
              decodedPlayerName,
              allOdds
            );
          }

          const matchups =
            (
              allMatchups ||
              []
            ).filter(
              (item) =>
                normalizeName(
                  item.game
                ) ===
                normalizeName(
                  game.name
                )
            );

          return buildMatchupScheduleItem(
            game,
            matchups,
            decodedPlayerName,
            allOdds
          );
        }
      );
    }

    async function loadSchedule({
      showLoading = false,
    } = {}) {
      if (requestInFlight) {
        return;
      }

      requestInFlight = true;

      if (
        showLoading &&
        active &&
        schedule.length ===
          0
      ) {
        setLoading(true);
      }

      try {
        /*
         * The old schedule loader made one
         * network request PER GAME.
         *
         * This version loads each underlying
         * API dataset exactly once and then
         * builds the full schedule locally.
         */
        const [
          matchupsResult,
          placementsResult,
          captainsResult,
          extrasResult,
        ] =
          await Promise.allSettled([
            getCachedData(
              MATCHUPS_CACHE_KEY,
              getCurrentGameMatchups,
              {
                ttl:
                  REFRESH_INTERVAL,
                timeout:
                  REQUEST_TIMEOUT,
              }
            ),

            getCachedData(
              PLACEMENTS_CACHE_KEY,
              getPlacements,
              {
                ttl:
                  REFRESH_INTERVAL,
                timeout:
                  REQUEST_TIMEOUT,
              }
            ),

            getCachedData(
              CAPTAINS_CACHE_KEY,
              getCaptainGames,
              {
                ttl:
                  REFRESH_INTERVAL,
                timeout:
                  REQUEST_TIMEOUT,
              }
            ),

            getCachedData(
              EXTRAS_CACHE_KEY,
              getGameExtras,
              {
                ttl:
                  REFRESH_INTERVAL,
                timeout:
                  REQUEST_TIMEOUT,
              }
            ),
          ]);

        if (!active) {
          return;
        }

        const allMatchups =
          matchupsResult.status ===
          "fulfilled"
            ? matchupsResult.value ||
              []
            : getCachedValue(
                MATCHUPS_CACHE_KEY
              ) || [];

        const allPlacements =
          placementsResult.status ===
          "fulfilled"
            ? placementsResult.value ||
              []
            : getCachedValue(
                PLACEMENTS_CACHE_KEY
              ) || [];

        const allCaptainGames =
          captainsResult.status ===
          "fulfilled"
            ? captainsResult.value ||
              []
            : getCachedValue(
                CAPTAINS_CACHE_KEY
              ) || [];

        const allExtras =
          extrasResult.status ===
          "fulfilled"
            ? extrasResult.value ||
              []
            : getCachedValue(
                EXTRAS_CACHE_KEY
              ) || [];

        if (
          matchupsResult.status ===
          "rejected"
        ) {
          console.error(
            "Player schedule matchup data error:",
            matchupsResult.reason
          );
        }

        if (
          placementsResult.status ===
          "rejected"
        ) {
          console.error(
            "Player schedule placement data error:",
            placementsResult.reason
          );
        }

        if (
          captainsResult.status ===
          "rejected"
        ) {
          console.error(
            "Player schedule captain data error:",
            captainsResult.reason
          );
        }

        if (
          extrasResult.status ===
          "rejected"
        ) {
          console.error(
            "Player schedule extras data error:",
            extrasResult.reason
          );
        }

        latestMatchups =
          allMatchups;

        latestPlacements =
          allPlacements;

        latestCaptainGames =
          allCaptainGames;

        latestExtras =
          allExtras;

        const nextSchedule =
          buildSchedule(
            latestMatchups,
            latestPlacements,
            latestCaptainGames,
            latestExtras,
            latestOdds
          );

        setSchedule(
          nextSchedule
        );

        setCachedData(
          scheduleCacheKey,
          nextSchedule
        );

        setError("");
        setLoading(false);
      } catch (err) {
        console.error(
          "Player schedule error:",
          err
        );

        if (!active) {
          return;
        }

        if (
          schedule.length ===
          0
        ) {
          setError(
            "Unable to load player schedule."
          );

          setLoading(false);
        }
      } finally {
        requestInFlight =
          false;
      }
    }

    async function loadOdds() {
      if (
        oddsRequestInFlight
      ) {
        return;
      }

      const cachedOdds =
        getCachedValue(
          ODDS_CACHE_KEY
        ) || [];

      const cachedOddsAreUsable =
        isCacheFresh(
          ODDS_CACHE_KEY,
          Infinity
        ) &&
        hasValidLiarsDiceOdds(
          cachedOdds
        );

      if (
        cachedOddsAreUsable
      ) {
        latestOdds =
          cachedOdds;

        if (
          latestMatchups.length > 0 ||
          latestPlacements.length > 0 ||
          latestCaptainGames.length > 0 ||
          latestExtras.length > 0
        ) {
          const nextSchedule =
            buildSchedule(
              latestMatchups,
              latestPlacements,
              latestCaptainGames,
              latestExtras,
              latestOdds
            );

          setSchedule(
            nextSchedule
          );

          setCachedData(
            scheduleCacheKey,
            nextSchedule
          );
        }

        return;
      }

      oddsRequestInFlight =
        true;

      try {
        const oddsData =
          await getCachedData(
            ODDS_CACHE_KEY,
            getOdds,
            {
              ttl: Infinity,
              force: true,
              timeout:
                REQUEST_TIMEOUT,
            }
          );

        if (!active) {
          return;
        }

        latestOdds =
          oddsData || [];

        /*
         * Odds are non-critical.
         * The schedule is already visible;
         * rebuild it locally once odds arrive.
         */
        const nextSchedule =
          buildSchedule(
            latestMatchups,
            latestPlacements,
            latestCaptainGames,
            latestExtras,
            latestOdds
          );

        setSchedule(
          nextSchedule
        );

        setCachedData(
          scheduleCacheKey,
          nextSchedule
        );
      } catch (err) {
        console.error(
          "Player schedule odds error:",
          err
        );
      } finally {
        oddsRequestInFlight =
          false;
      }
    }

    function dataIsStale() {
      return (
        !isCacheFresh(
          MATCHUPS_CACHE_KEY,
          REFRESH_INTERVAL
        ) ||
        !isCacheFresh(
          PLACEMENTS_CACHE_KEY,
          REFRESH_INTERVAL
        ) ||
        !isCacheFresh(
          CAPTAINS_CACHE_KEY,
          REFRESH_INTERVAL
        ) ||
        !isCacheFresh(
          EXTRAS_CACHE_KEY,
          REFRESH_INTERVAL
        )
      );
    }

    function refreshIfNeeded() {
      if (
        dataIsStale()
      ) {
        loadSchedule();
      }
    }

    /*
     * Cached player schedules render
     * immediately when you return.
     */
    if (
      initialSchedule.length >
      0
    ) {
      setLoading(false);

      refreshIfNeeded();
    } else {
      loadSchedule({
        showLoading: true,
      });
    }

    /*
     * Odds are session-cached and never
     * block the schedule from rendering.
     */
    loadOdds();

    const interval =
      setInterval(
        refreshIfNeeded,
        REFRESH_INTERVAL
      );

    return () => {
      active = false;

      clearInterval(
        interval
      );
    };
  }, [
    decodedPlayerName,
    scheduleCacheKey,
  ]);

  if (loading) {
    return (
      <div>
        <h1
          style={{
            color:
              "#ffffff",
          }}
        >
          📅{" "}
          {decodedPlayerName}
          's Schedule
        </h1>

        <p>
          Loading schedule...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() =>
            navigate(
              `/players/${encodeURIComponent(
                decodedPlayerName
              )}`
            )
          }
          style={
            backButtonStyle
          }
        >
          ← Back
        </button>

        <h1
          style={{
            color:
              "#ffffff",
          }}
        >
          📅{" "}
          {decodedPlayerName}
          's Schedule
        </h1>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() =>
          navigate(
            `/players/${encodeURIComponent(
              decodedPlayerName
            )}`
          )
        }
        style={
          backButtonStyle
        }
      >
        ← Back
      </button>

      <h1
        style={{
          color: "#ffffff",
          marginBottom:
            "6px",
        }}
      >
        📅{" "}
        {decodedPlayerName}
        's Schedule
      </h1>

      <p
        style={{
          color: "#8b949e",
          marginTop: 0,
          marginBottom:
            "22px",
        }}
      >
        All games in weekend order
      </p>

      {schedule.map(
        (item) => (
          <ScheduleCard
            key={
              item.game.id
            }
            item={item}
            onClick={() =>
              navigate(
                `/games/${item.game.id}`,
                {
                  state: {
                    fromPlayer:
                      `/players/${encodeURIComponent(
                        decodedPlayerName
                      )}`,
                  },
                }
              )
            }
          />
        )
      )}
    </div>
  );
}

function buildCaptainScheduleItem(
  game,
  captainGame,
  playerName,
  odds
) {
  if (!captainGame) {
    return {
      game,
      type: "captain",
      hasMatchup: false,
      matchups: [
        {
          label:
            "Teams TBD",
        },
      ],
    };
  }

  const team1 = [
    captainGame.captain1,
    ...(captainGame.picks1 ||
      []),
  ].filter(Boolean);

  const team2 = [
    captainGame.captain2,
    ...(captainGame.picks2 ||
      []),
  ].filter(Boolean);

  const normalizedPlayer =
    normalizeName(
      playerName
    );

  const onTeam1 =
    team1.some(
      (name) =>
        normalizeName(
          name
        ) ===
        normalizedPlayer
    );

  const onTeam2 =
    team2.some(
      (name) =>
        normalizeName(
          name
        ) ===
        normalizedPlayer
    );

  if (
    !onTeam1 &&
    !onTeam2
  ) {
    return {
      game,
      type: "captain",
      hasMatchup: false,
      matchups: [
        {
          label:
            "Team assignment TBD",
        },
      ],
    };
  }

  const ownTeam =
    onTeam1
      ? team1
      : team2;

  const opponentTeam =
    onTeam1
      ? team2
      : team1;

  const ownScore =
    onTeam1
      ? captainGame.score1
      : captainGame.score2;

  const opponentScore =
    onTeam1
      ? captainGame.score2
      : captainGame.score1;

  const captainOdds =
    getCaptainOdds(
      odds,
      game.name,
      captainGame.captain1,
      captainGame.captain2
    );

  const ownOdds =
    onTeam1
      ? captainOdds.odds1
      : captainOdds.odds2;

  const opponentOdds =
    onTeam1
      ? captainOdds.odds2
      : captainOdds.odds1;

  return {
    game,
    type: "captain",
    hasMatchup: true,
    matchups: [
      {
        ownTeam:
          ownTeam.join(
            " / "
          ),

        opponentTeam:
          opponentTeam.length >
          0
            ? opponentTeam.join(
                " / "
              )
            : "TBD",

        score:
          formatScore(
            ownScore,
            opponentScore
          ),

        winner:
          getWinnerSide(
            ownScore,
            opponentScore
          ),

        ownOdds,
        opponentOdds,
      },
    ],
  };
}

function buildPlacementScheduleItem(
  game,
  placements,
  playerName,
  odds
) {
  const playerPlacement =
    (
      placements || []
    ).find(
      (placement) =>
        teamIncludesPlayer(
          placement.team,
          playerName
        )
    );

  if (
    !playerPlacement
  ) {
    return {
      game,
      type: "placement",
      hasMatchup: false,
      matchups: [
        {
          label:
            "Entry TBD",
        },
      ],
    };
  }

  const place =
    String(
      playerPlacement.place ||
        ""
    ).trim();

  const outrightOdds =
    getOutrightOdds(
      odds,
      game.name,
      playerPlacement.team
    );

  return {
    game,
    type: "placement",
    hasMatchup: true,
    matchups: [
      {
        label:
          playerPlacement.team,

        result: place
          ? `Placement: ${place}`
          : "Placement: TBD",

        outrightOdds,
      },
    ],
  };
}

function buildEliminationScheduleItem(
  game,
  extras,
  playerName,
  odds
) {
  const normalizedPlayer =
    normalizeName(
      playerName
    );

  const playerGroups = [
    ...new Set(
      (extras || [])
        .filter(
          (item) =>
            normalizeName(
              item.team1
            ) ===
            normalizedPlayer
        )
        .map(
          (item) =>
            String(
              item.type || ""
            ).trim()
        )
        .filter(Boolean)
    ),
  ];

  if (
    playerGroups.length ===
    0
  ) {
    return {
      game,
      type: "elimination",
      hasMatchup: false,
      matchups: [
        {
          label:
            "Group assignment TBD",
        },
      ],
    };
  }

  return {
    game,
    type: "elimination",
    hasMatchup: true,

    matchups:
      playerGroups.map(
        (groupName) => {
          const groupRows =
            (extras || [])
              .filter(
                (item) =>
                  String(
                    item.type || ""
                  ).trim() ===
                  groupName &&
                  String(
                    item.team1 || ""
                  ).trim() !== ""
              )
              .sort(
                (a, b) =>
                  Number(
                    a.number || 0
                  ) -
                  Number(
                    b.number || 0
                  )
              );

          const ownRow =
            groupRows.find(
              (item) =>
                normalizeName(
                  item.team1
                ) ===
                normalizedPlayer
            );

          const finish =
            String(
              ownRow?.team2 ||
                ""
            ).trim();

          const showOdds =
            groupName ===
              "Round 1 - Game 1" ||
            groupName ===
              "Round 1 - Game 2";

          return {
            label:
              getChamberScheduleTitle(
                groupName
              ),

            result:
              finish
                ? `Finish: ${finish}`
                : "Finish: TBD",

            participants:
              groupRows.map(
                (item) => ({
                  name:
                    String(
                      item.team1 ||
                        ""
                    ).trim(),

                  outrightOdds:
                    showOdds
                      ? getOutrightOdds(
                          odds,
                          game.name,
                          item.team1
                        )
                      : "",
                })
              ),
          };
        }
      ),
  };
}

function getChamberScheduleTitle(
  groupName
) {
  if (
    groupName ===
    "Round 1 - Game 1"
  ) {
    return "Game 1";
  }

  if (
    groupName ===
    "Round 1 - Game 2"
  ) {
    return "Game 2";
  }

  if (
    groupName ===
    "Round 2 - Winners"
  ) {
    return "Winners Game";
  }

  if (
    groupName ===
    "Round 2 - Losers"
  ) {
    return "Losers Game";
  }

  return groupName;
}

function buildMatchupScheduleItem(
  game,
  matchups,
  playerName,
  odds
) {
  const playerMatchups =
    (
      matchups || []
    ).filter(
      (matchup) =>
        teamIncludesPlayer(
          matchup.team1,
          playerName
        ) ||
        teamIncludesPlayer(
          matchup.team2,
          playerName
        )
    );

  if (
    playerMatchups.length ===
    0
  ) {
    return {
      game,
      type: "matchup",
      hasMatchup: false,
      matchups: [
        {
          label:
            "Matchup TBD",
        },
      ],
    };
  }

  return {
    game,
    type: "matchup",
    hasMatchup: true,

    matchups:
      playerMatchups.map(
        (matchup) => {
          const onTeam1 =
            teamIncludesPlayer(
              matchup.team1,
              playerName
            );

          const ownTeam =
            onTeam1
              ? matchup.team1
              : matchup.team2;

          const opponentTeam =
            onTeam1
              ? matchup.team2
              : matchup.team1;

          const ownScore =
            onTeam1
              ? matchup.score1
              : matchup.score2;

          const opponentScore =
            onTeam1
              ? matchup.score2
              : matchup.score1;

          const matchupOdds =
            getMatchupOdds(
              odds,
              game.name,
              matchup.team1,
              matchup.team2
            );

          const ownOdds =
            onTeam1
              ? matchupOdds.odds1
              : matchupOdds.odds2;

          const opponentOdds =
            onTeam1
              ? matchupOdds.odds2
              : matchupOdds.odds1;

          return {
            ownTeam:
              ownTeam ||
              "TBD",

            opponentTeam:
              opponentTeam ||
              "TBD",

            score:
              formatScore(
                ownScore,
                opponentScore
              ),

            winner:
              getWinnerSide(
                ownScore,
                opponentScore
              ),

            ownOdds,
            opponentOdds,
          };
        }
      ),
  };
}

function ScheduleCard({
  item,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor:
          "#161b22",

        border:
          "1px solid #30363d",

        borderRadius:
          "14px",

        padding:
          "16px",

        marginBottom:
          "14px",

        cursor:
          "pointer",
      }}
    >
      <div
        style={{
          display:
            "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap:
            "12px",

          marginBottom:
            "14px",
        }}
      >
        <strong
          style={{
            color:
              "#ffffff",

            fontSize:
              "19px",
          }}
        >
          {item.game.icon}{" "}
          {item.game.name}
        </strong>

        <span
          style={{
            color:
              "#8b949e",

            fontSize:
              "22px",

            lineHeight:
              1,
          }}
        >
          ›
        </span>
      </div>

      <div
        style={{
          display:
            "grid",

          gap:
            "10px",
        }}
      >
        {item.matchups.map(
          (
            matchup,
            index
          ) => (
            <MatchupDisplay
              key={`${item.game.id}-${index}`}
              matchup={matchup}
              muted={!item.hasMatchup}
              gameName={item.game.name}
            />
          )
        )}
      </div>
    </div>
  );
}

function MatchupDisplay({
  matchup,
  muted,
  gameName,
}) {
  if (
    !matchup.ownTeam
  ) {
    return (
      <div
        style={{
          backgroundColor:
            "#21262d",

          border:
            "1px solid #30363d",

          borderRadius:
            "10px",

          padding:
            "12px",

          textAlign:
            "center",
        }}
      >
        <div
          style={{
            color: muted
              ? "#8b949e"
              : "#ffffff",

            fontSize:
              "21px",

            fontWeight:
              muted
                ? "normal"
                : "bold",
          }}
        >
          {matchup.label}
        </div>

        {matchup.participants &&
          matchup.participants.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                display: "grid",
                gap: "7px",
              }}
            >
              {matchup.participants.map(
                (participant, participantIndex) => (
                  <div
                    key={`${participant.name}-${participantIndex}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderTop:
                        participantIndex === 0
                          ? "1px solid #30363d"
                          : "none",
                      color: "#ffffff",
                      fontSize: "18px",
                      fontWeight: "600",
                    }}
                  >
                    <span>{participant.name}</span>

                    {participant.outrightOdds && (
                      <span
                        style={{
                          color: "#58a6ff",
                          fontSize: "15px",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatAmericanOdds(
                          participant.outrightOdds
                        )}
                      </span>
                    )}
                  </div>
                )
              )}
            </div>
          )}

        {matchup.result && (
          <div
            style={{
              color:
                "#f2cc60",

              marginTop:
                "6px",

              fontSize:
                "17px",

              fontWeight:
                "bold",
            }}
          >
            {matchup.result}
          </div>
        )}

        {matchup.outrightOdds && (
          <div
            style={{
              marginTop: "8px",
              color: "#58a6ff",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Odds: {formatAmericanOdds(
              matchup.outrightOdds
            )}
          </div>
        )}
      </div>
    );
  }

  const ownWon =
    matchup.winner ===
    "own";

  const opponentWon =
    matchup.winner ===
    "opponent";

  const isRockPaperScissors =
    gameName ===
    "Rock Paper Scissors";

  const ownResult =
    ownWon
      ? "WINNER"
      : isRockPaperScissors &&
          opponentWon
        ? "LOSER"
        : "";

  const opponentResult =
    opponentWon
      ? "WINNER"
      : isRockPaperScissors &&
          ownWon
        ? "LOSER"
        : "";

  return (
    <div
      style={{
        backgroundColor:
          "#21262d",

        border:
          "1px solid #30363d",

        borderRadius:
          "10px",

        padding:
          "14px 16px",
      }}
    >
      <div
        style={{
          backgroundColor:
            ownWon
              ? "rgba(63, 185, 80, 0.12)"
              : "transparent",

          border:
            ownWon
              ? "1px solid #3fb950"
              : "1px solid transparent",

          borderRadius:
            "9px",

          padding:
            "12px 10px",

          textAlign:
            "center",

          color:
            ownWon
              ? "#3fb950"
              : "#ffffff",

          fontSize:
            "21px",

          fontWeight:
            "bold",

          lineHeight:
            1.35,
        }}
      >
        {matchup.ownTeam}

        {matchup.ownOdds && (
          <div
            style={{
              marginTop: "4px",
              color: "#58a6ff",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {formatAmericanOdds(
              matchup.ownOdds
            )}
          </div>
        )}

        {ownResult && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              letterSpacing: "0.5px",
            }}
          >
            {ownResult}
          </div>
        )}
      </div>

      <div
        style={{
          textAlign:
            "center",

          color:
            "#8b949e",

          fontSize:
            "15px",

          fontWeight:
            "bold",

          margin:
            "10px 0",
        }}
      >
        VS
      </div>

      <div
        style={{
          backgroundColor:
            opponentWon
              ? "rgba(63, 185, 80, 0.12)"
              : "transparent",

          border:
            opponentWon
              ? "1px solid #3fb950"
              : "1px solid transparent",

          borderRadius:
            "9px",

          padding:
            "12px 10px",

          textAlign:
            "center",

          color:
            opponentWon
              ? "#3fb950"
              : "#ffffff",

          fontSize:
            "21px",

          fontWeight:
            "bold",

          lineHeight:
            1.35,
        }}
      >
        {matchup.opponentTeam}

        {matchup.opponentOdds && (
          <div
            style={{
              marginTop: "4px",
              color: "#58a6ff",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {formatAmericanOdds(
              matchup.opponentOdds
            )}
          </div>
        )}

        {opponentResult && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              letterSpacing: "0.5px",
            }}
          >
            {opponentResult}
          </div>
        )}
      </div>

      {!isRockPaperScissors && (
        <div
          style={{
            marginTop:
              "10px",

            paddingTop:
              "9px",

            borderTop:
              "1px solid #30363d",

            textAlign:
              "center",

            color:
              matchup.score === "Score: TBD"
                ? "#8b949e"
                : "#f2cc60",

            fontSize:
              "17px",

            fontWeight:
              "bold",
          }}
        >
          {matchup.score}
        </div>
      )}
    </div>
  );
}

const backButtonStyle = {
  marginBottom:
    "20px",

  padding:
    "10px 14px",

  borderRadius:
    "8px",

  border:
    "none",

  cursor:
    "pointer",
};

export default PlayerSchedule;