import {
  useEffect,
  useMemo,
  useState,
} from "react";

import gameDefinitions from "../data/games";
import { getAllTimeData } from "../services/allTime";

const historicalIcons = {
  "Water Spikeball": "💦🏐",
  "Pop Darts": "🎯",
  "Keg Stand": "🍺",
  Bet: "🎲",
  Unluckiest: "🍀",
};

function Stats() {
  const [
    overall,
    setOverall,
  ] = useState([]);

  const [
    gameRows,
    setGameRows,
  ] = useState([]);

  const [
    specialRows,
    setSpecialRows,
  ] = useState([]);

  const [
    expandedPlayer,
    setExpandedPlayer,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStats(
      showLoading = false
    ) {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const data =
          await getAllTimeData();

        if (!active) {
          return;
        }

        setOverall(
          data.overall
        );

        setGameRows(
          data.games
        );

        setSpecialRows(
          data.specials
        );

        setLastUpdated(
          new Date()
        );

        setError("");
      } catch (err) {
        console.error(
          "All-time stats error:",
          err
        );

        if (
          active &&
          overall.length === 0
        ) {
          setError(
            "Unable to load all-time statistics."
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

    loadStats(true);

    const interval =
      setInterval(
        () => {
          loadStats(false);
        },
        60000
      );

    return () => {
      active = false;

      clearInterval(
        interval
      );
    };
  }, []);

  const standings =
    useMemo(
      () =>
        [...overall].sort(
          (a, b) => {
            if (
              a.standing &&
              b.standing &&
              a.standing !==
                b.standing
            ) {
              return (
                a.standing -
                b.standing
              );
            }

            return (
              b.points -
              a.points
            );
          }
        ),
      [overall]
    );

  const careerPointsLeaders =
    useMemo(
      () =>
        getLeaders(
          overall,
          "points"
        ),
      [overall]
    );

  const firstPlaceLeaders =
    useMemo(
      () =>
        getLeaders(
          overall,
          "championships"
        ),
      [overall]
    );

  const careerSpinsLeaders =
    useMemo(
      () =>
        getLeaders(
          overall,
          "spins"
        ),
      [overall]
    );

  const hundredsLeaders =
    useMemo(
      () =>
        getLeaders(
          overall,
          "hundreds"
        ),
      [overall]
    );

  if (loading) {
    return (
      <div>
        <h1
          style={{
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          📊 All Time
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#8b949e",
          }}
        >
          Loading all-time statistics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1
          style={{
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          📊 All Time
        </h1>

        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          textAlign: "center",
          marginBottom: "22px",
        }}
      >
        <h1
          style={{
            color: "#ffffff",
            marginBottom: "5px",
          }}
        >
          📊 All Time
        </h1>

        <p
          style={{
            color: "#8b949e",
            margin: 0,
          }}
        >
          League career statistics
        </p>

        {lastUpdated && (
          <p
            style={{
              color: "#8b949e",
              fontSize: "12px",
              marginTop: "7px",
              marginBottom: 0,
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(2, 1fr)",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        <LeaderCard
          icon="👑"
          label="Career Points"
          leaders={
            careerPointsLeaders
          }
          value={
            careerPointsLeaders.length >
            0
              ? formatNumber(
                  careerPointsLeaders[0]
                    .points
                )
              : "-"
          }
        />

        <LeaderCard
          icon="🏆"
          label="1st Place Finishes"
          leaders={
            firstPlaceLeaders
          }
          value={
            firstPlaceLeaders.length >
            0
              ? formatNumber(
                  firstPlaceLeaders[0]
                    .championships
                )
              : "-"
          }
        />

        <LeaderCard
          icon="🎡"
          label="Career Spins"
          leaders={
            careerSpinsLeaders
          }
          value={
            careerSpinsLeaders.length >
            0
              ? formatNumber(
                  careerSpinsLeaders[0]
                    .spins
                )
              : "-"
          }
        />

        <LeaderCard
          icon="💯"
          label="Most 100s"
          leaders={
            hundredsLeaders
          }
          value={
            hundredsLeaders.length >
            0
              ? formatNumber(
                  hundredsLeaders[0]
                    .hundreds
                )
              : "-"
          }
        />
      </div>

      <h2
        style={{
          color: "#ffffff",
          marginBottom: "14px",
        }}
      >
        🏆 Career Leaderboard
      </h2>

      <div
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {standings.map(
          (
            player,
            index
          ) => {
            const isExpanded =
              expandedPlayer ===
              player.player;

            const playerGames =
              gameRows
                .filter(
                  (row) =>
                    normalizeName(
                      row.player
                    ) ===
                      normalizeName(
                        player.player
                      ) &&
                    hasGameActivity(
                      row
                    )
                )
                .sort(
                  (a, b) =>
                    b.points -
                    a.points
                );

            const playerSpecials =
              specialRows.filter(
                (row) =>
                  normalizeName(
                    row.player
                  ) ===
                    normalizeName(
                      player.player
                    ) &&
                  hasSpecialActivity(
                    row
                  )
              );

            return (
              <div
                key={
                  player.player
                }
                style={{
                  backgroundColor:
                    "#161b22",
                  border:
                    player.standing ===
                    1
                      ? "1px solid #f2cc60"
                      : "1px solid #30363d",
                  borderRadius:
                    "14px",
                  overflow:
                    "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPlayer(
                      isExpanded
                        ? ""
                        : player.player
                    )
                  }
                  style={{
                    width: "100%",
                    background:
                      "transparent",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    padding: 0,
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "52px 1fr auto",
                      alignItems:
                        "center",
                      gap: "10px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        textAlign:
                          "center",
                        fontSize:
                          player.standing <=
                          3
                            ? "28px"
                            : "17px",
                        fontWeight:
                          "bold",
                        color:
                          "#ffffff",
                      }}
                    >
                      {getRankDisplay(
                        player.standing ||
                          index + 1
                      )}
                    </div>

                    <div>
                      <strong
                        style={{
                          display:
                            "block",
                          color:
                            "#ffffff",
                          fontSize:
                            "19px",
                          marginBottom:
                            "5px",
                        }}
                      >
                        {
                          player.player
                        }
                      </strong>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "baseline",
                          flexWrap:
                            "wrap",
                          gap: "5px",
                        }}
                      >
                        <strong
                          style={{
                            color:
                              "#f2cc60",
                            fontSize:
                              "22px",
                          }}
                        >
                          {formatNumber(
                            player.points
                          )}
                        </strong>

                        <span
                          style={{
                            color:
                              "#f2cc60",
                            fontSize:
                              "11px",
                            fontWeight:
                              "bold",
                          }}
                        >
                          CAREER POINTS
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "6px",
                          color:
                            "#8b949e",
                          fontSize:
                            "12px",
                        }}
                      >
                        {player.years}{" "}
                        {player.years ===
                        1
                          ? "Year"
                          : "Years"}
                        {" · "}
                        {
                          player.championships
                        }{" "}
                        {player.championships ===
                        1
                          ? "1st Place Finish"
                          : "1st Place Finishes"}
                        {" · "}
                        Avg Finish{" "}
                        {formatDecimal(
                          player.averageFinish,
                          2
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        color:
                          "#8b949e",
                        fontSize:
                          "24px",
                        transform:
                          isExpanded
                            ? "rotate(90deg)"
                            : "none",
                        transition:
                          "transform 0.15s ease",
                      }}
                    >
                      ›
                    </span>
                  </div>

                  <CareerStatGrid
                    player={
                      player
                    }
                  />
                </button>

                {isExpanded && (
                  <div
                    style={{
                      borderTop:
                        "1px solid #30363d",
                      padding: "16px",
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom:
                          "14px",
                        textAlign:
                          "center",
                        color:
                          "#ffffff",
                      }}
                    >
                      🎯 Career Game
                      Breakdown
                    </h3>

                    {playerGames.length ===
                      0 &&
                    playerSpecials.length ===
                      0 ? (
                      <p
                        style={{
                          color:
                            "#8b949e",
                          textAlign:
                            "center",
                        }}
                      >
                        No career game
                        data available.
                      </p>
                    ) : (
                      <>
                        {playerGames.map(
                          (row) => (
                            <CareerGameCard
                              key={`${player.player}-${row.game}`}
                              row={row}
                            />
                          )
                        )}

                        {playerSpecials.length >
                          0 && (
                          <>
                            <h3
                              style={{
                                color:
                                  "#ffffff",
                                marginTop:
                                  "20px",
                                marginBottom:
                                  "10px",
                              }}
                            >
                              ⭐ Special
                              Categories
                            </h3>

                            {playerSpecials.map(
                              (row) => (
                                <SpecialCard
                                  key={`${player.player}-${row.game}`}
                                  row={
                                    row
                                  }
                                />
                              )
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>

      <div
        style={{
          backgroundColor:
            "#161b22",
          border:
            "1px solid #30363d",
          borderRadius:
            "14px",
          padding: "18px",
          marginTop: "24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            color: "#ffffff",
            marginTop: 0,
            marginBottom: "7px",
          }}
        >
          📚 Season History
        </h2>

        <p
          style={{
            color: "#8b949e",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          2021–2026 individual
          season history will live
          here next.
        </p>
      </div>
    </div>
  );
}

function LeaderCard({
  icon,
  label,
  leaders,
  value,
}) {
  const leaderNames =
    leaders
      .map(
        (leader) =>
          leader.player
      )
      .join(" / ");

  return (
    <div
      style={{
        backgroundColor:
          "#161b22",
        border:
          "1px solid #30363d",
        borderRadius:
          "12px",
        padding:
          "14px 10px",
        textAlign:
          "center",
      }}
    >
      <div
        style={{
          color: "#8b949e",
          fontSize: "11px",
          fontWeight: "bold",
          textTransform:
            "uppercase",
          marginBottom: "8px",
        }}
      >
        {icon} {label}
      </div>

      <strong
        style={{
          display: "block",
          color: "#f2cc60",
          fontSize: "22px",
          marginBottom: "5px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: "bold",
          lineHeight: 1.4,
        }}
      >
        {leaderNames || "-"}
      </span>
    </div>
  );
}

function CareerStatGrid({
  player,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(3, 1fr)",
        borderTop:
          "1px solid #30363d",
      }}
    >
      <CareerStat
        label="Points / Year"
        value={
          formatDecimal(
            player.pointsPerYear,
            2
          )
        }
        rightBorder
        bottomBorder
      />

      <CareerStat
        label="Career Spins"
        value={
          formatNumber(
            player.spins
          )
        }
        rightBorder
        bottomBorder
      />

      <CareerStat
        label="Spins / Year"
        value={
          formatDecimal(
            player.spinsPerYear,
            2
          )
        }
        bottomBorder
      />

      <CareerStat
        label="Win %"
        value={
          formatPercent(
            player.winPct
          )
        }
        rightBorder
      />

      <CareerStat
        label="Points / Spin"
        value={
          formatDecimal(
            player.pointsPerSpin,
            2
          )
        }
        rightBorder
      />

      <CareerStat
        label="100s"
        value={
          formatNumber(
            player.hundreds
          )
        }
      />
    </div>
  );
}

function CareerStat({
  label,
  value,
  rightBorder = false,
  bottomBorder = false,
}) {
  return (
    <div
      style={{
        padding: "14px 6px",
        textAlign: "center",
        borderRight:
          rightBorder
            ? "1px solid #30363d"
            : "none",
        borderBottom:
          bottomBorder
            ? "1px solid #30363d"
            : "none",
      }}
    >
      <span
        style={{
          display: "block",
          color: "#8b949e",
          fontSize: "10px",
          textTransform:
            "uppercase",
          marginBottom: "6px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#ffffff",
          fontSize: "15px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function CareerGameCard({
  row,
}) {
  const icon =
    getGameIcon(
      row.game
    );

  const hasRecord =
    row.wins > 0 ||
    row.losses > 0;

  const hasAverageFinish =
    row.averageFinish > 0;

  return (
    <div
      style={{
        backgroundColor:
          "#21262d",
        border:
          "1px solid #30363d",
        borderRadius:
          "12px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        <strong
          style={{
            color: "#ffffff",
            fontSize: "16px",
          }}
        >
          {icon} {row.game}
        </strong>

        <strong
          style={{
            color: "#f2cc60",
            whiteSpace:
              "nowrap",
          }}
        >
          {formatNumber(
            row.points
          )}{" "}
          pts
        </strong>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          color: "#8b949e",
          fontSize: "12px",
        }}
      >
        <span>
          {row.years}{" "}
          {row.years === 1
            ? "Year"
            : "Years"}
        </span>

        {hasRecord && (
          <span>
            Record:{" "}
            <strong
              style={{
                color:
                  "#ffffff",
              }}
            >
              {row.wins}-
              {row.losses}
            </strong>
          </span>
        )}

        {hasRecord && (
          <span>
            W%:{" "}
            <strong
              style={{
                color:
                  "#ffffff",
              }}
            >
              {formatPercent(
                row.winPct
              )}
            </strong>
          </span>
        )}

        {hasAverageFinish && (
          <span>
            Avg Finish:{" "}
            <strong
              style={{
                color:
                  "#ffffff",
              }}
            >
              {formatDecimal(
                row.averageFinish,
                2
              )}
            </strong>
          </span>
        )}

        {row.spins > 0 && (
          <span>
            Spins:{" "}
            <strong
              style={{
                color:
                  "#ffffff",
              }}
            >
              {formatNumber(
                row.spins
              )}
            </strong>
          </span>
        )}

        {row.spinValue !==
          0 && (
          <span>
            SV:{" "}
            <strong
              style={{
                color:
                  "#ffffff",
              }}
            >
              {formatNumber(
                row.spinValue
              )}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}

function SpecialCard({
  row,
}) {
  return (
    <div
      style={{
        backgroundColor:
          "#21262d",
        border:
          "1px solid #30363d",
        borderRadius:
          "12px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <strong
          style={{
            color: "#ffffff",
          }}
        >
          {getGameIcon(
            row.game
          )}{" "}
          {row.game}
        </strong>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <strong
            style={{
              display: "block",
              color: "#f2cc60",
            }}
          >
            {formatNumber(
              row.specialCount
            )}
          </strong>

          {row.specialValue !==
            0 && (
            <span
              style={{
                display:
                  "block",
                color:
                  "#8b949e",
                fontSize:
                  "11px",
                marginTop:
                  "3px",
              }}
            >
              Value:{" "}
              {formatNumber(
                row.specialValue
              )}
            </span>
          )}
        </div>
      </div>

      {row.notes && (
        <div
          style={{
            color: "#8b949e",
            fontSize: "11px",
            marginTop: "7px",
          }}
        >
          {row.notes}
        </div>
      )}
    </div>
  );
}

function getLeaders(
  players,
  field
) {
  if (
    players.length === 0
  ) {
    return [];
  }

  const highestValue =
    Math.max(
      ...players.map(
        (player) =>
          Number(
            player[field] || 0
          )
      )
    );

  return players.filter(
    (player) =>
      Number(
        player[field] || 0
      ) === highestValue
  );
}

function hasGameActivity(
  row
) {
  return (
    row.years > 0 ||
    row.points !== 0 ||
    row.spins !== 0 ||
    row.wins !== 0 ||
    row.losses !== 0 ||
    row.averageFinish !== 0
  );
}

function hasSpecialActivity(
  row
) {
  return (
    row.specialCount !== 0 ||
    row.specialValue !== 0 ||
    row.spinValue !== 0
  );
}

function getGameIcon(
  gameName
) {
  const currentGame =
    gameDefinitions.find(
      (game) =>
        normalizeName(
          game.name
        ) ===
        normalizeName(
          gameName
        )
    );

  if (currentGame) {
    return currentGame.icon;
  }

  return (
    historicalIcons[
      gameName
    ] || "🎯"
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
    .replace(/\s+/g, " ");
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

function formatNumber(
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

  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits:
        2,
    }
  );
}

function formatDecimal(
  value,
  places = 2
) {
  const number =
    Number(value);

  if (
    Number.isNaN(
      number
    )
  ) {
    return (
      0
    ).toFixed(
      places
    );
  }

  return number.toFixed(
    places
  );
}

function formatPercent(
  value
) {
  const number =
    Number(value);

  if (
    Number.isNaN(
      number
    )
  ) {
    return "0.00%";
  }

  return `${(
    number * 100
  ).toFixed(2)}%`;
}

export default Stats;