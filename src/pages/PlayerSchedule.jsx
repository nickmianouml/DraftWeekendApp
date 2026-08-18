import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import games from "../data/games";

import { getCurrentGameMatchups } from "../services/currentGame";
import { getPlacements } from "../services/placements";
import { getCaptainGames } from "../services/captains";
import { getGameExtras } from "../services/gameExtras";
import {
  formatAmericanOdds,
  getOdds,
} from "../services/odds";

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

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeGameName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeTeam(value) {
  return String(value || "")
    .split(/\s*\/\s*|\s*,\s*|\s*&\s*/)
    .map(normalizeName)
    .filter(Boolean)
    .sort()
    .join("|");
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

  return leftNumber >
    rightNumber
    ? "own"
    : "opponent";
}

function findMatchupOdds(
  odds,
  gameName,
  team1,
  team2
) {
  const targetGame =
    normalizeGameName(
      gameName
    );

  const source =
    (odds || []).filter(
      (item) =>
        item.type ===
          "Matchup" &&
        normalizeGameName(
          item.game
        ) ===
          targetGame
    );

  const firstTeam =
    normalizeTeam(
      team1
    );

  const secondTeam =
    normalizeTeam(
      team2
    );

  const direct =
    source.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) === firstTeam &&
        normalizeTeam(
          item.team2
        ) === secondTeam
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
    source.find(
      (item) =>
        normalizeTeam(
          item.team1
        ) === secondTeam &&
        normalizeTeam(
          item.team2
        ) === firstTeam
    );

  if (reversed) {
    return {
      odds1:
        reversed.odds2,

      odds2:
        reversed.odds1,
    };
  }

  return {
    odds1: "",
    odds2: "",
  };
}

function findCaptainOdds(
  odds,
  gameName,
  captain1,
  captain2
) {
  const targetGame =
    normalizeGameName(
      gameName
    );

  const rows =
    (odds || []).filter(
      (item) =>
        item.type ===
          "Matchup" &&
        normalizeGameName(
          item.game
        ) ===
          targetGame
    );

  const direct =
    rows.find(
      (item) =>
        normalizeName(
          item.team1
        ) ===
          normalizeName(
            captain1
          ) &&
        normalizeName(
          item.team2
        ) ===
          normalizeName(
            captain2
          )
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
    rows.find(
      (item) =>
        normalizeName(
          item.team1
        ) ===
          normalizeName(
            captain2
          ) &&
        normalizeName(
          item.team2
        ) ===
          normalizeName(
            captain1
          )
    );

  if (reversed) {
    return {
      odds1:
        reversed.odds2,

      odds2:
        reversed.odds1,
    };
  }

  return {
    odds1: "",
    odds2: "",
  };
}

function findOutrightOdds(
  odds,
  gameName,
  participant
) {
  const targetGame =
    normalizeGameName(
      gameName
    );

  const rows =
    (odds || []).filter(
      (item) =>
        normalizeGameName(
          item.game
        ) ===
          targetGame
    );

  const teamKey =
    normalizeTeam(
      participant
    );

  const teamRow =
    rows.find(
      (item) => {
        if (
          item.type !==
          "Team Outright"
        ) {
          return false;
        }

        const sourceTeam =
          normalizeTeam(
            [
              item.player1,
              item.player2,
            ]
              .filter(Boolean)
              .join(" / ")
          );

        return (
          sourceTeam ===
          teamKey
        );
      }
    );

  if (teamRow) {
    return (
      teamRow.outrightOdds
    );
  }

  const name =
    normalizeName(
      participant
    );

  const playerRow =
    rows.find(
      (item) =>
        item.type ===
          "Individual Outright" &&
        normalizeName(
          item.player1
        ) === name
    );

  return (
    playerRow
      ?.outrightOdds ||
    ""
  );
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

  const [
    schedule,
    setSchedule,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSchedule(
      showLoading = false
    ) {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const [
          matchupResult,
          captainResult,
          placementResult,
          extrasResult,
          oddsResult,
        ] =
          await Promise.allSettled([
            getCurrentGameMatchups(),
            getCaptainGames(),
            getPlacements(),
            getGameExtras(),
            getOdds(),
          ]);

        if (!active) {
          return;
        }

        const allMatchups =
          matchupResult.status ===
          "fulfilled"
            ? matchupResult.value
            : [];

        const allCaptainGames =
          captainResult.status ===
          "fulfilled"
            ? captainResult.value
            : [];

        const allPlacements =
          placementResult.status ===
          "fulfilled"
            ? placementResult.value
            : [];

        const allExtras =
          extrasResult.status ===
          "fulfilled"
            ? extrasResult.value
            : [];

        const allOdds =
          oddsResult.status ===
          "fulfilled"
            ? oddsResult.value
            : [];

        if (
          matchupResult.status ===
          "rejected"
        ) {
          console.error(
            "Schedule matchup data error:",
            matchupResult.reason
          );
        }

        if (
          captainResult.status ===
          "rejected"
        ) {
          console.error(
            "Schedule captain data error:",
            captainResult.reason
          );
        }

        if (
          placementResult.status ===
          "rejected"
        ) {
          console.error(
            "Schedule placement data error:",
            placementResult.reason
          );
        }

        if (
          extrasResult.status ===
          "rejected"
        ) {
          console.error(
            "Schedule extras data error:",
            extrasResult.reason
          );
        }

        if (
          oddsResult.status ===
          "rejected"
        ) {
          console.error(
            "Schedule odds data error:",
            oddsResult.reason
          );
        }

        const primaryRequestsFailed =
          matchupResult.status ===
            "rejected" &&
          captainResult.status ===
            "rejected" &&
          placementResult.status ===
            "rejected" &&
          extrasResult.status ===
            "rejected";

        if (
          primaryRequestsFailed
        ) {
          throw new Error(
            "All schedule data sources failed."
          );
        }

        const results =
          games.map(
            (game) => {
              try {
                const gameName =
                  normalizeGameName(
                    game.name
                  );

                if (
                  captainGames.includes(
                    game.name
                  )
                ) {
                  const captainGame =
                    allCaptainGames.find(
                      (item) =>
                        normalizeGameName(
                          item.game
                        ) ===
                        gameName
                    ) ||
                    null;

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
                    allPlacements.filter(
                      (item) =>
                        normalizeGameName(
                          item.game
                        ) ===
                        gameName
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
                    allExtras.filter(
                      (item) =>
                        normalizeGameName(
                          item.game
                        ) ===
                        gameName
                    );

                  return buildEliminationScheduleItem(
                    game,
                    extras,
                    decodedPlayerName,
                    allOdds
                  );
                }

                if (
                  game.name ===
                  "Unluckiest"
                ) {
                  return {
                    game,
                    type:
                      "special",

                    hasMatchup:
                      false,

                    matchups: [
                      {
                        label:
                          "Determined by lowest Points Per Spin.",
                      },
                    ],
                  };
                }

                const matchups =
                  allMatchups.filter(
                    (item) =>
                      normalizeGameName(
                        item.game
                      ) ===
                      gameName
                  );

                return buildMatchupScheduleItem(
                  game,
                  matchups,
                  decodedPlayerName,
                  allOdds
                );
              } catch (
                gameError
              ) {
                console.error(
                  `Schedule error for ${game.name}:`,
                  gameError
                );

                return {
                  game,

                  type:
                    "error",

                  hasMatchup:
                    false,

                  matchups: [
                    {
                      label:
                        "Unable to load this game right now.",
                    },
                  ],
                };
              }
            }
          );

        if (!active) {
          return;
        }

        setSchedule(
          results
        );

        setError("");
      } catch (err) {
        console.error(
          "Player schedule error:",
          err
        );

        if (
          active &&
          schedule.length ===
            0
        ) {
          setError(
            "Unable to load player schedule."
          );
        }
      } finally {
        if (
          active &&
          showLoading
        ) {
          setLoading(false);
        }
      }
    }

    loadSchedule(true);

    const interval =
      setInterval(
        () => {
          loadSchedule(
            false
          );
        },
        30000
      );

    return () => {
      active = false;

      clearInterval(
        interval
      );
    };
  }, [
    decodedPlayerName,
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
          {
            decodedPlayerName
          }
          's Schedule
        </h1>

        <p>
          Loading
          schedule...
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
          {
            decodedPlayerName
          }
          's Schedule
        </h1>

        <p>
          {error}
        </p>
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
          color:
            "#ffffff",

          marginBottom:
            "6px",
        }}
      >
        📅{" "}
        {
          decodedPlayerName
        }
        's Schedule
      </h1>

      <p
        style={{
          color:
            "#8b949e",

          marginTop: 0,

          marginBottom:
            "22px",
        }}
      >
        All games in
        weekend order
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
  if (
    !captainGame
  ) {
    return {
      game,

      type:
        "captain",

      hasMatchup:
        false,

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

      type:
        "captain",

      hasMatchup:
        false,

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
    findCaptainOdds(
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

    type:
      "captain",

    hasMatchup:
      true,

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

        ownOdds,

        opponentOdds,

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

      type:
        "placement",

      hasMatchup:
        false,

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
    findOutrightOdds(
      odds,
      game.name,
      playerPlacement.team
    );

  return {
    game,

    type:
      "placement",

    hasMatchup:
      true,

    matchups: [
      {
        label:
          playerPlacement.team,

        odds:
          outrightOdds,

        oddsLabel:
          "TO FINISH 1ST",

        result: place
          ? `Placement: ${place}`
          : "Placement: TBD",
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
  const playerRows =
    (
      extras || []
    ).filter(
      (item) =>
        normalizeName(
          item.team1
        ) ===
        normalizeName(
          playerName
        )
    );

  if (
    playerRows.length ===
    0
  ) {
    return {
      game,

      type:
        "elimination",

      hasMatchup:
        false,

      matchups: [
        {
          label:
            "Group assignment TBD",
        },
      ],
    };
  }

  const outrightOdds =
    findOutrightOdds(
      odds,
      game.name,
      playerName
    );

  return {
    game,

    type:
      "elimination",

    hasMatchup:
      true,

    matchups:
      playerRows.map(
        (item) => {
          const finish =
            String(
              item.team2 ||
                ""
            ).trim();

          return {
            label:
              item.type,

            odds:
              outrightOdds,

            oddsLabel:
              "TO FINISH 1ST",

            result:
              finish
                ? `Finish: ${finish}`
                : "Finish: TBD",
          };
        }
      ),
  };
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

      type:
        "matchup",

      hasMatchup:
        false,

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

    type:
      "matchup",

    hasMatchup:
      true,

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
            findMatchupOdds(
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

            ownOdds,

            opponentOdds,

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
      onClick={
        onClick
      }
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

          gap: "12px",

          marginBottom:
            "14px",
        }}
      >
        <strong
          style={{
            color:
              "#ffffff",

            fontSize:
              "17px",
          }}
        >
          {
            item.game.icon
          }{" "}
          {
            item.game.name
          }
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

          gap: "10px",
        }}
      >
        {item.matchups.map(
          (
            matchup,
            index
          ) => (
            <MatchupDisplay
              key={`${item.game.id}-${index}`}
              matchup={
                matchup
              }
              muted={
                !item.hasMatchup
              }
            />
          )
        )}
      </div>
    </div>
  );
}

function SmallOdds({
  value,
  label = "ODDS",
}) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return (
    <div
      style={{
        marginTop:
          "5px",
      }}
    >
      <span
        style={{
          display:
            "block",

          color:
            "#8b949e",

          fontSize:
            "9px",

          letterSpacing:
            "0.5px",

          fontWeight:
            "bold",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color:
            "#58a6ff",

          fontSize:
            "14px",
        }}
      >
        {formatAmericanOdds(
          value
        )}
      </strong>
    </div>
  );
}

function MatchupDisplay({
  matchup,
  muted,
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
            color:
              muted
                ? "#8b949e"
                : "#ffffff",

            fontSize:
              "14px",

            fontWeight:
              muted
                ? "normal"
                : "bold",
          }}
        >
          {
            matchup.label
          }
        </div>

        <SmallOdds
          value={
            matchup.odds
          }
          label={
            matchup.oddsLabel ||
            "ODDS"
          }
        />

        {matchup.result && (
          <div
            style={{
              color:
                "#f2cc60",

              marginTop:
                "6px",

              fontSize:
                "13px",

              fontWeight:
                "bold",
            }}
          >
            {
              matchup.result
            }
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
          "12px 14px",
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
            "9px 10px",

          textAlign:
            "center",

          color:
            ownWon
              ? "#3fb950"
              : "#ffffff",

          fontSize:
            "14px",

          fontWeight:
            "bold",

          lineHeight:
            1.45,
        }}
      >
        {
          matchup.ownTeam
        }

        <SmallOdds
          value={
            matchup.ownOdds
          }
        />

        {ownWon && (
          <div
            style={{
              marginTop:
                "4px",

              fontSize:
                "10px",

              letterSpacing:
                "0.5px",
            }}
          >
            WINNER
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
            "11px",

          fontWeight:
            "bold",

          margin:
            "8px 0",
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
            "9px 10px",

          textAlign:
            "center",

          color:
            opponentWon
              ? "#3fb950"
              : "#ffffff",

          fontSize:
            "14px",

          fontWeight:
            "bold",

          lineHeight:
            1.45,
        }}
      >
        {
          matchup.opponentTeam
        }

        <SmallOdds
          value={
            matchup.opponentOdds
          }
        />

        {opponentWon && (
          <div
            style={{
              marginTop:
                "4px",

              fontSize:
                "10px",

              letterSpacing:
                "0.5px",
            }}
          >
            WINNER
          </div>
        )}
      </div>

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
            matchup.score ===
            "Score: TBD"
              ? "#8b949e"
              : "#f2cc60",

          fontSize:
            "13px",

          fontWeight:
            "bold",
        }}
      >
        {
          matchup.score
        }
      </div>
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