import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import games from "../data/games";

import { getMatchupsForGame } from "../services/currentGame";
import { getPlacementsForGame } from "../services/placements";
import { getCaptainGame } from "../services/captains";
import { getExtrasForGame } from "../services/gameExtras";

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
  const left = String(score1 ?? "").trim();
  const right = String(score2 ?? "").trim();

  if (!left && !right) {
    return "Score: TBD";
  }

  return `Score: ${left || "-"} - ${right || "-"}`;
}

function getWinnerSide(score1, score2) {
  const left = String(score1 ?? "")
    .trim()
    .toUpperCase();

  const right = String(score2 ?? "")
    .trim()
    .toUpperCase();

  if (!left || !right) {
    return null;
  }

  if (left === "W" && right === "L") {
    return "own";
  }

  if (left === "L" && right === "W") {
    return "opponent";
  }

  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (
    Number.isNaN(leftNumber) ||
    Number.isNaN(rightNumber)
  ) {
    return null;
  }

  if (leftNumber > rightNumber) {
    return "own";
  }

  if (rightNumber > leftNumber) {
    return "opponent";
  }

  return null;
}

function PlayerSchedule() {
  const { playerName } = useParams();
  const navigate = useNavigate();

  const decodedPlayerName =
    decodeURIComponent(playerName || "");

  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        setError("");
        setLoading(true);

        const results = await Promise.all(
          games.map(async (game) => {
            try {
              if (captainGames.includes(game.name)) {
                const captainGame =
                  await getCaptainGame(game.name);

                return buildCaptainScheduleItem(
                  game,
                  captainGame,
                  decodedPlayerName
                );
              }

              if (placementGames.includes(game.name)) {
                const placements =
                  await getPlacementsForGame(game.name);

                return buildPlacementScheduleItem(
                  game,
                  placements,
                  decodedPlayerName
                );
              }

              if (game.name === "Elimination Chamber") {
                const extras =
                  await getExtrasForGame(game.name);

                return buildEliminationScheduleItem(
                  game,
                  extras,
                  decodedPlayerName
                );
              }

              if (game.name === "Unluckiest") {
                return {
                  game,
                  type: "special",
                  hasMatchup: false,
                  matchups: [
                    {
                      label:
                        "Determined by lowest Points Per Spin.",
                    },
                  ],
                };
              }

              const matchups =
                await getMatchupsForGame(game.name);

              return buildMatchupScheduleItem(
                game,
                matchups,
                decodedPlayerName
              );
            } catch (gameError) {
              console.error(
                `Schedule error for ${game.name}:`,
                gameError
              );

              return {
                game,
                type: "error",
                hasMatchup: false,
                matchups: [
                  {
                    label:
                      "Unable to load this game right now.",
                  },
                ],
              };
            }
          })
        );

        setSchedule(results);
      } catch (err) {
        console.error(
          "Player schedule error:",
          err
        );

        setError(
          "Unable to load player schedule."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();

    const interval = setInterval(
      loadSchedule,
      30000
    );

    return () => clearInterval(interval);
  }, [decodedPlayerName]);

  if (loading) {
    return (
      <div>
        <h1
          style={{
            color: "#ffffff",
          }}
        >
          📅 {decodedPlayerName}'s Schedule
        </h1>

        <p>Loading schedule...</p>
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
          style={backButtonStyle}
        >
          ← Back
        </button>

        <h1
          style={{
            color: "#ffffff",
          }}
        >
          📅 {decodedPlayerName}'s Schedule
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
        style={backButtonStyle}
      >
        ← Back
      </button>

      <h1
        style={{
          color: "#ffffff",
          marginBottom: "6px",
        }}
      >
        📅 {decodedPlayerName}'s Schedule
      </h1>

      <p
        style={{
          color: "#8b949e",
          marginTop: 0,
          marginBottom: "22px",
        }}
      >
        All games in weekend order
      </p>

      {schedule.map((item) => (
        <ScheduleCard
          key={item.game.id}
          item={item}
          onClick={() =>
            navigate(`/games/${item.game.id}`)
          }
        />
      ))}
    </div>
  );
}

function buildCaptainScheduleItem(
  game,
  captainGame,
  playerName
) {
  if (!captainGame) {
    return {
      game,
      type: "captain",
      hasMatchup: false,
      matchups: [
        {
          label: "Teams TBD",
        },
      ],
    };
  }

  const team1 = [
    captainGame.captain1,
    ...(captainGame.picks1 || []),
  ].filter(Boolean);

  const team2 = [
    captainGame.captain2,
    ...(captainGame.picks2 || []),
  ].filter(Boolean);

  const normalizedPlayer =
    normalizeName(playerName);

  const onTeam1 = team1.some(
    (name) =>
      normalizeName(name) === normalizedPlayer
  );

  const onTeam2 = team2.some(
    (name) =>
      normalizeName(name) === normalizedPlayer
  );

  if (!onTeam1 && !onTeam2) {
    return {
      game,
      type: "captain",
      hasMatchup: false,
      matchups: [
        {
          label: "Team assignment TBD",
        },
      ],
    };
  }

  const ownTeam = onTeam1 ? team1 : team2;
  const opponentTeam = onTeam1 ? team2 : team1;

  const ownScore = onTeam1
    ? captainGame.score1
    : captainGame.score2;

  const opponentScore = onTeam1
    ? captainGame.score2
    : captainGame.score1;

  return {
    game,
    type: "captain",
    hasMatchup: true,
    matchups: [
      {
        ownTeam: ownTeam.join(" / "),
        opponentTeam:
          opponentTeam.length > 0
            ? opponentTeam.join(" / ")
            : "TBD",
        score: formatScore(
          ownScore,
          opponentScore
        ),
        winner: getWinnerSide(
          ownScore,
          opponentScore
        ),
        winner: getWinnerSide(
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
  playerName
) {
  const playerPlacement =
    (placements || []).find(
      (placement) =>
        teamIncludesPlayer(
          placement.team,
          playerName
        )
    );

  if (!playerPlacement) {
    return {
      game,
      type: "placement",
      hasMatchup: false,
      matchups: [
        {
          label: "Entry TBD",
        },
      ],
    };
  }

  const place =
    String(
      playerPlacement.place || ""
    ).trim();

  return {
    game,
    type: "placement",
    hasMatchup: true,
    matchups: [
      {
        label: playerPlacement.team,
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
  playerName
) {
  const playerRows =
    (extras || []).filter(
      (item) =>
        normalizeName(item.team1) ===
        normalizeName(playerName)
    );

  if (playerRows.length === 0) {
    return {
      game,
      type: "elimination",
      hasMatchup: false,
      matchups: [
        {
          label: "Group assignment TBD",
        },
      ],
    };
  }

  return {
    game,
    type: "elimination",
    hasMatchup: true,
    matchups: playerRows.map((item) => {
      const finish =
        String(item.team2 || "").trim();

      return {
        label: item.type,
        result: finish
          ? `Finish: ${finish}`
          : "Finish: TBD",
      };
    }),
  };
}

function buildMatchupScheduleItem(
  game,
  matchups,
  playerName
) {
  const playerMatchups =
    (matchups || []).filter(
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

  if (playerMatchups.length === 0) {
    return {
      game,
      type: "matchup",
      hasMatchup: false,
      matchups: [
        {
          label: "Matchup TBD",
        },
      ],
    };
  }

  return {
    game,
    type: "matchup",
    hasMatchup: true,
    matchups: playerMatchups.map((matchup) => {
      const onTeam1 =
        teamIncludesPlayer(
          matchup.team1,
          playerName
        );

      const ownTeam = onTeam1
        ? matchup.team1
        : matchup.team2;

      const opponentTeam = onTeam1
        ? matchup.team2
        : matchup.team1;

      const ownScore = onTeam1
        ? matchup.score1
        : matchup.score2;

      const opponentScore = onTeam1
        ? matchup.score2
        : matchup.score1;

      return {
        ownTeam: ownTeam || "TBD",
        opponentTeam:
          opponentTeam || "TBD",
        score: formatScore(
          ownScore,
          opponentScore
        ),
        winner: getWinnerSide(
          ownScore,
          opponentScore
        ),
      };
    }),
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
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "14px",
        padding: "16px",
        marginBottom: "14px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <strong
          style={{
            color: "#ffffff",
            fontSize: "17px",
          }}
        >
          {item.game.icon} {item.game.name}
        </strong>

        <span
          style={{
            color: "#8b949e",
            fontSize: "22px",
            lineHeight: 1,
          }}
        >
          ›
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        {item.matchups.map(
          (matchup, index) => (
            <MatchupDisplay
              key={`${item.game.id}-${index}`}
              matchup={matchup}
              muted={!item.hasMatchup}
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
}) {
  if (!matchup.ownTeam) {
    return (
      <div
        style={{
          backgroundColor: "#21262d",
          border: "1px solid #30363d",
          borderRadius: "10px",
          padding: "12px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: muted
              ? "#8b949e"
              : "#ffffff",
            fontSize: "14px",
            fontWeight: muted
              ? "normal"
              : "bold",
          }}
        >
          {matchup.label}
        </div>

        {matchup.result && (
          <div
            style={{
              color: "#f2cc60",
              marginTop: "6px",
              fontSize: "13px",
              fontWeight: "bold",
            }}
          >
            {matchup.result}
          </div>
        )}
      </div>
    );
  }

  const ownWon =
    matchup.winner === "own";

  const opponentWon =
    matchup.winner === "opponent";

  return (
    <div
      style={{
        backgroundColor: "#21262d",
        border: "1px solid #30363d",
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          backgroundColor: ownWon
            ? "rgba(63, 185, 80, 0.12)"
            : "transparent",
          border: ownWon
            ? "1px solid #3fb950"
            : "1px solid transparent",
          borderRadius: "9px",
          padding: "9px 10px",
          textAlign: "center",
          color: ownWon
            ? "#3fb950"
            : "#ffffff",
          fontSize: "14px",
          fontWeight: "bold",
          lineHeight: 1.45,
        }}
      >
        {matchup.ownTeam}

        {ownWon && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "10px",
              letterSpacing: "0.5px",
            }}
          >
            WINNER
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          color: "#8b949e",
          fontSize: "11px",
          fontWeight: "bold",
          margin: "8px 0",
        }}
      >
        VS
      </div>

      <div
        style={{
          backgroundColor: opponentWon
            ? "rgba(63, 185, 80, 0.12)"
            : "transparent",
          border: opponentWon
            ? "1px solid #3fb950"
            : "1px solid transparent",
          borderRadius: "9px",
          padding: "9px 10px",
          textAlign: "center",
          color: opponentWon
            ? "#3fb950"
            : "#ffffff",
          fontSize: "14px",
          fontWeight: "bold",
          lineHeight: 1.45,
        }}
      >
        {matchup.opponentTeam}

        {opponentWon && (
          <div
            style={{
              marginTop: "4px",
              fontSize: "10px",
              letterSpacing: "0.5px",
            }}
          >
            WINNER
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "10px",
          paddingTop: "9px",
          borderTop: "1px solid #30363d",
          textAlign: "center",
          color: matchup.score === "Score: TBD"
            ? "#8b949e"
            : "#f2cc60",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        {matchup.score}
      </div>
    </div>
  );
}

const backButtonStyle = {
  marginBottom: "20px",
  padding: "10px 14px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};

export default PlayerSchedule;