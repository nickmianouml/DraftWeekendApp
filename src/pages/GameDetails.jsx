import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import games from "../data/games";

import { getGameData } from "../services/games";
import { getMatchupsForGame } from "../services/currentGame";
import { getPlacementsForGame } from "../services/placements";
import { getCaptainGame } from "../services/captains";
import { getExtrasForGame } from "../services/gameExtras";
import { getGameStatuses } from "../services/gameStatus";

function GameDetails() {
  const { gameId } = useParams();
const navigate = useNavigate();
const location = useLocation();

const backTarget =
  location.state?.fromPlayer || "/games";

  const [gameData, setGameData] = useState([]);
  const [matchups, setMatchups] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [captainGame, setCaptainGame] = useState(null);
  const [extras, setExtras] = useState([]);
  const [liveStatuses, setLiveStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const game = games.find((item) => item.id === gameId);

  const gameName = game ? game.name : "";
  const gameIcon = game ? game.icon : "";

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

  const isPlacementGame =
    placementGames.includes(gameName);

  const isCaptainGame =
    captainGames.includes(gameName);

  const isRPS =
    gameName === "Rock Paper Scissors";

  const isEliminationChamber =
    gameName === "Elimination Chamber";

  useEffect(() => {
    async function loadGame() {
      if (!gameName) {
        setError("Game not found.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const [statsData, statusData] =
          await Promise.all([
            getGameData(gameName),
            getGameStatuses(),
          ]);

        setGameData(statsData);
        setLiveStatuses(statusData);

        if (isEliminationChamber) {
          const extrasData =
            await getExtrasForGame(gameName);

          setExtras(extrasData);
          setPlacements([]);
          setMatchups([]);
          setCaptainGame(null);
        } else if (isPlacementGame) {
          const placementData =
            await getPlacementsForGame(gameName);

          setPlacements(placementData);
          setMatchups([]);
          setCaptainGame(null);
          setExtras([]);
        } else if (isCaptainGame) {
          const [captainData, extrasData] =
            await Promise.all([
              getCaptainGame(gameName),
              getExtrasForGame(gameName),
            ]);

          setCaptainGame(captainData);
          setExtras(extrasData);
          setMatchups([]);
          setPlacements([]);
        } else {
          const matchupData =
            await getMatchupsForGame(gameName);

          setMatchups(matchupData);
          setPlacements([]);
          setCaptainGame(null);
          setExtras([]);
        }

        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Game details error:",
          err
        );

        setError(
          "Unable to load game data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGame();

    const interval = setInterval(
      loadGame,
      10000
    );

    return () =>
      clearInterval(interval);
  }, [
    gameName,
    isPlacementGame,
    isCaptainGame,
    isEliminationChamber,
  ]);

  function getStatusDisplay(status) {
    const normalized =
      String(status || "")
        .trim()
        .toLowerCase();

    if (normalized === "in progress") {
      return {
        text: "● LIVE",
        color: "#3fb950",
      };
    }

    if (normalized === "complete") {
      return {
        text: "✓ Complete",
        color: "#8b949e",
      };
    }

    return {
      text: "Not Started",
      color: "#8b949e",
    };
  }

  function getPlaceLabel(place) {
    const rawPlace =
      String(place || "").trim();

    if (!rawPlace) {
      return "";
    }

    const number = Number(
      rawPlace.replace(/[^\d]/g, "")
    );

    if (Number.isNaN(number)) {
      return rawPlace;
    }

    if (number === 1) {
      return "🥇 1st";
    }

    if (number === 2) {
      return "🥈 2nd";
    }

    if (number === 3) {
      return "🥉 3rd";
    }

    return `${number}${getOrdinalSuffix(number)}`;
  }

  function getGameStatus() {
    if (isEliminationChamber) {
      const match =
        liveStatuses.find(
          (item) =>
            String(item.game || "")
              .trim()
              .toLowerCase() ===
            "elimination chamber"
        );

      return getStatusDisplay(
        match?.status
      );
    }

    if (isPlacementGame) {
      return getStatusDisplay(
        placements[0]?.status
      );
    }

    if (isCaptainGame) {
      return getStatusDisplay(
        captainGame?.status
      );
    }

    return getStatusDisplay(
      matchups[0]?.status
    );
  }

  if (!game) {
    return (
      <div>
        <button
          onClick={() =>
            navigate(backTarget)
          }
        >
          ← Back
        </button>

        <h1>Game Not Found</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1>
          {gameIcon} {gameName}
        </h1>

        <p>Loading game data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() =>
            navigate(backTarget)
          }
        >
          ← Back
        </button>

        <h1>
          {gameIcon} {gameName}
        </h1>

        <p>{error}</p>
      </div>
    );
  }

  const gameStatus =
    getGameStatus();

  const sortedPlacements =
    gameName === "Liars Dice"
      ? [...placements]
      : [...placements].sort(
          (a, b) => {
            const aPlace = Number(
              String(a.place || "")
                .replace(/[^\d]/g, "")
            );

            const bPlace = Number(
              String(b.place || "")
                .replace(/[^\d]/g, "")
            );

            const aHasPlace =
              a.place !== "" &&
              !Number.isNaN(aPlace);

            const bHasPlace =
              b.place !== "" &&
              !Number.isNaN(bPlace);

            if (
              aHasPlace &&
              bHasPlace
            ) {
              return aPlace - bPlace;
            }

            if (aHasPlace) {
              return -1;
            }

            if (bHasPlace) {
              return 1;
            }

            return a.team.localeCompare(
              b.team
            );
          }
        );

  return (
    <div>
      <button
        onClick={() =>
          navigate(backTarget)
        }
        style={{
          marginBottom: "20px",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <h1
        style={{
          marginBottom: "6px",
          color: "white",
        }}
      >
        {gameIcon} {gameName}
      </h1>

      <p
        style={{
          color: gameStatus.color,
          fontWeight: "bold",
          marginTop: 0,
          marginBottom: "6px",
        }}
      >
        {gameStatus.text}
      </p>

      {lastUpdated && (
        <p
          style={{
            color: "#8b949e",
            fontSize: "13px",
            marginTop: 0,
            marginBottom: "20px",
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

      {isCaptainGame &&
        captainGame && (
          <CaptainTeams
            captainGame={
              captainGame
            }
            gameName={gameName}
            extras={extras}
            gameStatus={gameStatus}
          />
        )}

      {isEliminationChamber &&
        extras.length > 0 && (
          <EliminationChamberSection
            extras={extras}
            gameStatus={gameStatus}
          />
        )}

      {isPlacementGame &&
        sortedPlacements.length > 0 && (
          <PlacementSection
            placements={
              sortedPlacements
            }
            gameStatus={gameStatus}
            getPlaceLabel={
              getPlaceLabel
            }
          />
        )}

      {!isPlacementGame &&
        !isCaptainGame &&
        !isEliminationChamber &&
        matchups.length > 0 &&
        (isRPS ? (
          <RPSSection
            matchups={matchups}
            gameStatus={gameStatus}
          />
        ) : (
          <MatchupSection
            matchups={matchups}
            gameStatus={gameStatus}
            getStatusDisplay={
              getStatusDisplay
            }
          />
        ))}

      <GameLeaderboard
        gameData={gameData}
      />
    </div>
  );
}

function getOrdinalSuffix(number) {
  const mod100 =
    number % 100;

  if (
    mod100 >= 11 &&
    mod100 <= 13
  ) {
    return "th";
  }

  switch (number % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatOrdinal(value) {
  const raw =
    String(value || "").trim();

  if (!raw) {
    return "—";
  }

  const number = Number(
    raw.replace(/[^\d]/g, "")
  );

  if (Number.isNaN(number)) {
    return raw;
  }

  if (number === 1) {
    return "🥇 1st";
  }

  if (number === 2) {
    return "🥈 2nd";
  }

  if (number === 3) {
    return "🥉 3rd";
  }

  return `${number}${getOrdinalSuffix(number)}`;
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getWinnerSide(score1, score2) {
  const raw1 = String(score1 ?? "").trim();
  const raw2 = String(score2 ?? "").trim();

  if (!raw1 || !raw2) {
    return null;
  }

  const result1 = raw1.toUpperCase();
  const result2 = raw2.toUpperCase();

  if (result1 === "W" && result2 === "L") {
    return 1;
  }

  if (result1 === "L" && result2 === "W") {
    return 2;
  }

  const number1 = Number(raw1);
  const number2 = Number(raw2);

  if (
    Number.isNaN(number1) ||
    Number.isNaN(number2) ||
    number1 === number2
  ) {
    return null;
  }

  return number1 > number2 ? 1 : 2;
}

function CaptainTeams({
  captainGame,
  gameName,
  extras,
  gameStatus,
}) {
  const team1Players = [
    captainGame.captain1,
    ...captainGame.picks1,
  ].filter(Boolean);

  const team2Players = [
    captainGame.captain2,
    ...captainGame.picks2,
  ].filter(Boolean);

  const isHRDerby =
    gameName === "HR Derby";

  const winnerSide =
    getWinnerSide(
      captainGame.score1,
      captainGame.score2
    );

  const homeRunTotals = {};

  if (isHRDerby) {
    extras.forEach((item) => {
      const type = String(
        item.type || ""
      )
        .trim()
        .toLowerCase();

      const player =
        normalizeName(
          item.team1
        );

      const rawTotal =
        String(
          item.team2 ?? ""
        ).trim();

      if (
        type === "home runs" &&
        player &&
        rawTotal !== ""
      ) {
        const total =
          Number(rawTotal);

        if (
          !Number.isNaN(total)
        ) {
          homeRunTotals[player] =
            total;
        }
      }
    });
  }

  function getHomeRuns(
    playerName
  ) {
    const key =
      normalizeName(
        playerName
      );

    if (!key) {
      return null;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        homeRunTotals,
        key
      )
    ) {
      return homeRunTotals[key];
    }

    return null;
  }

  return (
    <div
      style={{
        backgroundColor:
          "#161b22",
        border:
          gameStatus.text ===
          "● LIVE"
            ? "1px solid #3fb950"
            : "1px solid #30363d",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          textAlign: "center",
          color: "white",
        }}
      >
        👥 Teams
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 50px 1fr",
          gap: "10px",
        }}
      >
        <TeamRoster
          captain={
            captainGame.captain1
          }
          players={
            team1Players
          }
          showHomeRuns={
            isHRDerby
          }
          getHomeRuns={
            getHomeRuns
          }
          isWinner={
            winnerSide === 1
          }
        />

        <div
          style={{
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "flex-start",
            paddingTop: "38px",
            color: "#8b949e",
            fontWeight: "bold",
          }}
        >
          VS
        </div>

        <TeamRoster
          captain={
            captainGame.captain2
          }
          players={
            team2Players
          }
          showHomeRuns={
            isHRDerby
          }
          getHomeRuns={
            getHomeRuns
          }
          isWinner={
            winnerSide === 2
          }
        />
      </div>

      {gameName ===
        "Relay Race" && (
        <RelayRaceResult
          captainGame={
            captainGame
          }
        />
      )}

      {gameName !==
        "Relay Race" &&
        (captainGame.score1 ||
          captainGame.score2) && (
          <FinalScore
            score1={
              captainGame.score1
            }
            score2={
              captainGame.score2
            }
          />
        )}

      {gameName ===
        "Flip Cup" && (
        <FlipCupRounds
          extras={extras}
        />
      )}

      {gameName ===
        "Baseball" && (
        <BaseballBoxScore
          extras={extras}
          captain1={
            captainGame.captain1
          }
          captain2={
            captainGame.captain2
          }
        />
      )}
    </div>
  );
}

function TeamRoster({
  captain,
  players,
  showHomeRuns,
  getHomeRuns,
  isWinner = false,
}) {
  const captainHomeRuns =
    showHomeRuns
      ? getHomeRuns(captain)
      : null;

  return (
    <div
      style={{
        textAlign: "center",
        backgroundColor: isWinner
          ? "rgba(46, 160, 67, 0.14)"
          : "transparent",
        border: isWinner
          ? "1px solid #3fb950"
          : "1px solid transparent",
        borderRadius: "10px",
        padding: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
          gap: "8px",
          marginBottom: "4px",
          flexWrap: "wrap",
        }}
      >
        <strong
          style={{
            fontSize: "18px",
            color: "#f2cc60",
          }}
        >
          {captain || "TBD"}
        </strong>

        {showHomeRuns &&
          captainHomeRuns !==
            null && (
            <strong
              style={{
                color:
                  "#f2cc60",
                fontSize:
                  "14px",
                whiteSpace:
                  "nowrap",
              }}
            >
              {captainHomeRuns} HR
            </strong>
          )}
      </div>

      <span
        style={{
          display: "block",
          color: "#8b949e",
          fontSize: "11px",
          fontWeight: "bold",
          marginBottom: isWinner
            ? "4px"
            : "12px",
        }}
      >
        CAPTAIN
      </span>

      {isWinner && (
        <span
          style={{
            display: "block",
            color: "#3fb950",
            fontSize: "10px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          WINNER
        </span>
      )}

      {players
        .slice(1)
        .map(
          (
            player,
            index
          ) => {
            const homeRuns =
              showHomeRuns
                ? getHomeRuns(
                    player
                  )
                : null;

            return (
              <div
                key={`${player}-${index}`}
                style={{
                  padding:
                    "10px 4px",
                  borderTop:
                    "1px solid #30363d",
                  fontSize:
                    "15px",
                  display:
                    "flex",
                  justifyContent:
                    showHomeRuns
                      ? "space-between"
                      : "center",
                  alignItems:
                    "center",
                  gap: "8px",
                }}
              >
                <div>
                  <span
                    style={{
                      color:
                        "#8b949e",
                      marginRight:
                        "5px",
                    }}
                  >
                    {index + 1}.
                  </span>

                  <span>
                    {player}
                  </span>
                </div>

                {showHomeRuns &&
                  homeRuns !==
                    null && (
                    <strong
                      style={{
                        color:
                          "#f2cc60",
                        fontSize:
                          "14px",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {homeRuns} HR
                    </strong>
                  )}
              </div>
            );
          }
        )}

      {players.length === 1 && (
        <p
          style={{
            color: "#8b949e",
            fontSize: "13px",
          }}
        >
          Draft pending
        </p>
      )}
    </div>
  );
}

function FinalScore({
  score1,
  score2,
}) {
  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "18px",
        borderTop:
          "1px solid #30363d",
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#8b949e",
          fontSize: "12px",
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        FINAL SCORE
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: "bold",
        }}
      >
        {score1 || "-"}
        {"  -  "}
        {score2 || "-"}
      </div>
    </div>
  );
}

function RelayRaceResult({
  captainGame,
}) {
  const team1Result =
    String(
      captainGame.score1 || ""
    )
      .trim()
      .toUpperCase();

  const team2Result =
    String(
      captainGame.score2 || ""
    )
      .trim()
      .toUpperCase();

  if (
    !team1Result &&
    !team2Result
  ) {
    return null;
  }

  const team1Won =
    team1Result === "W";

  const team2Won =
    team2Result === "W";

  return (
    <div
      style={{
        marginTop: "20px",
        paddingTop: "18px",
        borderTop:
          "1px solid #30363d",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginTop: 0,
          color: "white",
        }}
      >
        🏁 Result
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "12px",
        }}
      >
        <div
          style={{
            backgroundColor:
              "#21262d",
            borderRadius:
              "12px",
            padding: "14px",
            textAlign:
              "center",
          }}
        >
          <strong>
            {
              captainGame.captain1
            }
          </strong>

          <div
            style={{
              marginTop: "6px",
              color: team1Won
                ? "#3fb950"
                : "#8b949e",
              fontWeight:
                "bold",
            }}
          >
            {team1Won
              ? "🏆 Winner"
              : "Loss"}
          </div>
        </div>

        <div
          style={{
            backgroundColor:
              "#21262d",
            borderRadius:
              "12px",
            padding: "14px",
            textAlign:
              "center",
          }}
        >
          <strong>
            {
              captainGame.captain2
            }
          </strong>

          <div
            style={{
              marginTop: "6px",
              color: team2Won
                ? "#3fb950"
                : "#8b949e",
              fontWeight:
                "bold",
            }}
          >
            {team2Won
              ? "🏆 Winner"
              : "Loss"}
          </div>
        </div>
      </div>
    </div>
  );
}

function FlipCupRounds({
  extras,
}) {
  if (
    extras.length === 0
  ) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "22px",
        paddingTop: "18px",
        borderTop:
          "1px solid #30363d",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginTop: 0,
          color: "white",
        }}
      >
        🥤 Round Results
      </h3>

      {extras.map(
        (round) => (
          <div
            key={`round-${round.number}`}
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "1fr 70px 1fr",
              alignItems:
                "center",
              padding:
                "8px 0",
            }}
          >
            <div
              style={{
                textAlign:
                  "center",
                fontSize:
                  "20px",
                color:
                  "#3fb950",
              }}
            >
              {round.team1 ||
                ""}
            </div>

            <div
              style={{
                textAlign:
                  "center",
                color:
                  "#8b949e",
                fontSize:
                  "13px",
              }}
            >
              Round{" "}
              {round.number}
            </div>

            <div
              style={{
                textAlign:
                  "center",
                fontSize:
                  "20px",
                color:
                  "#3fb950",
              }}
            >
              {round.team2 ||
                ""}
            </div>
          </div>
        )
      )}
    </div>
  );
}

function BaseballBoxScore({
  extras,
  captain1,
  captain2,
}) {
  if (
    extras.length === 0
  ) {
    return null;
  }

  const total1 =
    extras.reduce(
      (total, inning) =>
        total +
        (Number(
          inning.team1
        ) || 0),
      0
    );

  const total2 =
    extras.reduce(
      (total, inning) =>
        total +
        (Number(
          inning.team2
        ) || 0),
      0
    );

  return (
    <div
      style={{
        marginTop: "22px",
        paddingTop: "18px",
        borderTop:
          "1px solid #30363d",
        overflowX: "auto",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          marginTop: 0,
          color: "white",
        }}
      >
        ⚾ Box Score
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
          textAlign: "center",
          minWidth: "500px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: "8px",
                color: "#8b949e",
              }}
            >
              Team
            </th>

            {extras.map(
              (inning) => (
                <th
                  key={`inning-${inning.number}`}
                  style={{
                    padding:
                      "8px",
                    color:
                      "#8b949e",
                  }}
                >
                  {
                    inning.number
                  }
                </th>
              )
            )}

            <th
              style={{
                padding: "8px",
                color: "#f2cc60",
              }}
            >
              R
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td
              style={{
                padding: "8px",
                fontWeight:
                  "bold",
              }}
            >
              {captain1}
            </td>

            {extras.map(
              (inning) => (
                <td
                  key={`team1-${inning.number}`}
                  style={{
                    padding:
                      "8px",
                  }}
                >
                  {inning.team1 ||
                    "-"}
                </td>
              )
            )}

            <td
              style={{
                padding: "8px",
                fontWeight:
                  "bold",
                color:
                  "#f2cc60",
              }}
            >
              {total1}
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: "8px",
                fontWeight:
                  "bold",
              }}
            >
              {captain2}
            </td>

            {extras.map(
              (inning) => (
                <td
                  key={`team2-${inning.number}`}
                  style={{
                    padding:
                      "8px",
                  }}
                >
                  {inning.team2 ||
                    "-"}
                </td>
              )
            )}

            <td
              style={{
                padding: "8px",
                fontWeight:
                  "bold",
                color:
                  "#f2cc60",
              }}
            >
              {total2}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EliminationChamberSection({
  extras,
  gameStatus,
}) {
  const groupNames = [
    "Round 1 - Game 1",
    "Round 1 - Game 2",
    "Round 2 - Winners",
    "Round 2 - Losers",
  ];

  return (
    <div
      style={{
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "16px",
          color: "white",
        }}
      >
        🏟️ Matchups
      </h2>

      {groupNames.map(
        (groupName) => {
          const group = extras
            .filter(
              (item) =>
                item.type ===
                groupName
            )
            .sort(
              (a, b) =>
                Number(a.number) -
                Number(b.number)
            );

          const hasPlayers =
            group.some(
              (item) =>
                String(
                  item.team1 || ""
                ).trim() !== ""
            );

          if (!hasPlayers) {
            return null;
          }

          return (
            <div
              key={groupName}
              style={{
                backgroundColor:
                  "#161b22",
                border:
                  gameStatus.text ===
                  "● LIVE"
                    ? "1px solid #3fb950"
                    : "1px solid #30363d",
                borderRadius:
                  "16px",
                padding: "18px",
                marginBottom:
                  "16px",
              }}
            >
              <h3
                style={{
                  textAlign:
                    "center",
                  marginTop: 0,
                  marginBottom:
                    "14px",
                  color: "white",
                }}
              >
                {getChamberGroupTitle(
                  groupName
                )}
              </h3>

              {group.map(
                (item, index) => {
                  const player =
                    String(
                      item.team1 ||
                        ""
                    ).trim();

                  const finish =
                    String(
                      item.team2 ||
                        ""
                    ).trim();

                  if (!player) {
                    return null;
                  }

                  return (
                    <div
                      key={`${groupName}-${player}-${index}`}
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        backgroundColor:
                          "#21262d",
                        borderRadius:
                          "10px",
                        padding:
                          "12px 14px",
                        marginBottom:
                          index ===
                          group.length -
                            1
                            ? "0"
                            : "8px",
                      }}
                    >
                      <strong>
                        {player}
                      </strong>

                      <strong
                        style={{
                          color:
                            finish
                              ? "#f2cc60"
                              : "#8b949e",
                        }}
                      >
                        {finish
                          ? formatOrdinal(
                              finish
                            )
                          : "—"}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>
          );
        }
      )}
    </div>
  );
}

function getChamberGroupTitle(
  groupName
) {
  if (
    groupName ===
    "Round 1 - Game 1"
  ) {
    return "Round 1 · Game 1";
  }

  if (
    groupName ===
    "Round 1 - Game 2"
  ) {
    return "Round 1 · Game 2";
  }

  if (
    groupName ===
    "Round 2 - Winners"
  ) {
    return "Round 2 · Winners Group";
  }

  if (
    groupName ===
    "Round 2 - Losers"
  ) {
    return "Round 2 · Losers Group";
  }

  return groupName;
}

function PlacementSection({
  placements,
  gameStatus,
  getPlaceLabel,
}) {
  return (
    <div
      style={{
        backgroundColor:
          "#161b22",
        border:
          gameStatus.text ===
          "● LIVE"
            ? "1px solid #3fb950"
            : "1px solid #30363d",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          textAlign: "center",
          color: "white",
        }}
      >
        🏁 Placements
      </h2>

      {placements.map(
        (
          placement,
          index
        ) => (
          <div
            key={`${placement.team}-${index}`}
            style={{
              backgroundColor:
                "#21262d",
              borderRadius:
                "14px",
              padding: "16px",
              marginBottom:
                index ===
                placements.length -
                  1
                  ? "0"
                  : "12px",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <strong>
              {
                placement.team
              }
            </strong>

            <strong
              style={{
                color:
                  placement.place
                    ? "#f2cc60"
                    : "#8b949e",
              }}
            >
              {placement.place
                ? getPlaceLabel(
                    placement.place
                  )
                : "—"}
            </strong>
          </div>
        )
      )}
    </div>
  );
}

function RPSSection({
  matchups,
  gameStatus,
}) {
  return (
    <div
      style={{
        backgroundColor:
          "#161b22",
        border:
          gameStatus.text ===
          "● LIVE"
            ? "1px solid #3fb950"
            : "1px solid #30363d",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          textAlign: "center",
          color: "white",
        }}
      >
        ✊ Matchups
      </h2>

      {matchups.map(
        (
          matchup,
          index
        ) => {
          const result1 =
            String(
              matchup.score1 ||
                ""
            )
              .trim()
              .toUpperCase();

          const result2 =
            String(
              matchup.score2 ||
                ""
            )
              .trim()
              .toUpperCase();

          const player1Won =
            result1 === "W";

          const player2Won =
            result2 === "W";

          const player1Lost =
            result1 === "L";

          const player2Lost =
            result2 === "L";

          return (
            <div
              key={`${matchup.team1}-${matchup.team2}-${index}`}
              style={{
                backgroundColor:
                  "#21262d",
                borderRadius:
                  "14px",
                padding: "16px",
                marginBottom:
                  index ===
                  matchups.length -
                    1
                    ? "0"
                    : "12px",
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 60px 1fr",
                  alignItems:
                    "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    textAlign:
                      "center",
                    opacity:
                      player1Lost
                        ? 0.5
                        : 1,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "24px",
                      minHeight:
                        "30px",
                    }}
                  >
                    {player1Won
                      ? "🏆"
                      : ""}
                  </div>

                  <strong
                    style={{
                      fontSize:
                        "17px",
                      color:
                        player1Won
                          ? "#3fb950"
                          : "white",
                    }}
                  >
                    {
                      matchup.team1
                    }
                  </strong>

                  {player1Won && (
                    <div
                      style={{
                        marginTop:
                          "6px",
                        fontSize:
                          "11px",
                        fontWeight:
                          "bold",
                        color:
                          "#3fb950",
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
                    fontWeight:
                      "bold",
                  }}
                >
                  VS
                </div>

                <div
                  style={{
                    textAlign:
                      "center",
                    opacity:
                      player2Lost
                        ? 0.5
                        : 1,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "24px",
                      minHeight:
                        "30px",
                    }}
                  >
                    {player2Won
                      ? "🏆"
                      : ""}
                  </div>

                  <strong
                    style={{
                      fontSize:
                        "17px",
                      color:
                        player2Won
                          ? "#3fb950"
                          : "white",
                    }}
                  >
                    {
                      matchup.team2
                    }
                  </strong>

                  {player2Won && (
                    <div
                      style={{
                        marginTop:
                          "6px",
                        fontSize:
                          "11px",
                        fontWeight:
                          "bold",
                        color:
                          "#3fb950",
                      }}
                    >
                      WINNER
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function MatchupSection({
  matchups,
  gameStatus,
  getStatusDisplay,
}) {
  return (
    <div
      style={{
        backgroundColor:
          "#161b22",
        border:
          gameStatus.text ===
          "● LIVE"
            ? "1px solid #3fb950"
            : "1px solid #30363d",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "24px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          textAlign: "center",
          color: "white",
        }}
      >
        🤝 Matchups
      </h2>

      {matchups.map(
        (
          matchup,
          index
        ) => {
          const status =
            getStatusDisplay(
              matchup.status
            );

          const winnerSide =
            getWinnerSide(
              matchup.score1,
              matchup.score2
            );

          const team1Won =
            winnerSide === 1;

          const team2Won =
            winnerSide === 2;

          return (
            <div
              key={`${matchup.team1}-${matchup.team2}-${index}`}
              style={{
                backgroundColor:
                  "#21262d",
                borderRadius:
                  "14px",
                padding: "16px",
                marginBottom:
                  index ===
                  matchups.length -
                    1
                    ? "0"
                    : "12px",
              }}
            >
              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 70px 1fr",
                  alignItems:
                    "stretch",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    textAlign:
                      "center",
                    backgroundColor:
                      team1Won
                        ? "rgba(46, 160, 67, 0.14)"
                        : "transparent",
                    border:
                      team1Won
                        ? "1px solid #3fb950"
                        : "1px solid transparent",
                    borderRadius:
                      "10px",
                    padding:
                      "10px 6px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        team1Won
                          ? "#3fb950"
                          : "white",
                    }}
                  >
                    {
                      matchup.team1
                    }
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "28px",
                      marginTop:
                        "4px",
                      color:
                        team1Won
                          ? "#3fb950"
                          : "white",
                    }}
                  >
                    {matchup.score1 ||
                      "-"}
                  </div>

                  {team1Won && (
                    <div
                      style={{
                        marginTop:
                          "4px",
                        color:
                          "#3fb950",
                        fontSize:
                          "10px",
                        fontWeight:
                          "bold",
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
                    display: "flex",
                    flexDirection:
                      "column",
                    justifyContent:
                      "center",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#8b949e",
                    }}
                  >
                    VS
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "18px",
                      color:
                        status.color,
                      fontSize:
                        "12px",
                      fontWeight:
                        "bold",
                    }}
                  >
                    {status.text}
                  </div>
                </div>

                <div
                  style={{
                    textAlign:
                      "center",
                    backgroundColor:
                      team2Won
                        ? "rgba(46, 160, 67, 0.14)"
                        : "transparent",
                    border:
                      team2Won
                        ? "1px solid #3fb950"
                        : "1px solid transparent",
                    borderRadius:
                      "10px",
                    padding:
                      "10px 6px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        team2Won
                          ? "#3fb950"
                          : "white",
                    }}
                  >
                    {
                      matchup.team2
                    }
                  </strong>

                  <div
                    style={{
                      fontSize:
                        "28px",
                      marginTop:
                        "4px",
                      color:
                        team2Won
                          ? "#3fb950"
                          : "white",
                    }}
                  >
                    {matchup.score2 ||
                      "-"}
                  </div>

                  {team2Won && (
                    <div
                      style={{
                        marginTop:
                          "4px",
                        color:
                          "#3fb950",
                        fontSize:
                          "10px",
                        fontWeight:
                          "bold",
                      }}
                    >
                      WINNER
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

function GameLeaderboard({
  gameData,
}) {
  const rankedGameData = [...gameData].sort(
    (a, b) =>
      Number(b.points || 0) -
      Number(a.points || 0)
  );

  return (
    <>
      <h2
        style={{
          color: "white",
        }}
      >
        🏆 Game Leaderboard
      </h2>

      {gameData.length === 0 ? (
        <p>
          No player data available yet.
        </p>
      ) : (
        rankedGameData.map(
          (
            player,
            index
          ) => {
            const playerPoints =
              Number(player.points || 0);

            const numericRank =
              1 +
              rankedGameData.filter(
                (otherPlayer) =>
                  Number(
                    otherPlayer.points || 0
                  ) > playerPoints
              ).length;

            let rank =
              `#${numericRank}`;

            if (numericRank === 1) {
              rank = "🥇";
            }

            if (numericRank === 2) {
              rank = "🥈";
            }

            if (numericRank === 3) {
              rank = "🥉";
            }

            return (
              <div
                key={
                  player.player
                }
                style={{
                  backgroundColor:
                    "#21262d",
                  border:
                    "1px solid #30363d",
                  borderRadius:
                    "12px",
                  padding: "16px",
                  marginBottom:
                    "12px",
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
                    marginBottom:
                      "8px",
                  }}
                >
                  <strong
                    style={{
                      fontSize:
                        "18px",
                    }}
                  >
                    {rank}{" "}
                    {
                      player.player
                    }
                  </strong>

                  <strong
                    style={{
                      color:
                        "#f2cc60",
                    }}
                  >
                    {Number(
                      player.points ||
                        0
                    ).toLocaleString()}{" "}
                    pts
                  </strong>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    color:
                      "#8b949e",
                    fontSize:
                      "14px",
                  }}
                >
                  <span>
                    🎡{" "}
                    {
                      player.spins
                    }{" "}
                    Spins
                  </span>

                  <span>
                    SV:{" "}
                    {
                      player.spinValue
                    }
                  </span>
                </div>
              </div>
            );
          }
        )
      )}
    </>
  );
}

export default GameDetails;