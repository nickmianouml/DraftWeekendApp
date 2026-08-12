import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getPlayer } from "../services/players";
import { getPlayerGames } from "../services/playerGames";
import { getPlayerRecord } from "../services/playerRecord";
import games from "../data/games";

function PlayerProfile() {
  const { playerName } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);
  const [playerGames, setPlayerGames] = useState([]);

  const [record, setRecord] = useState({
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    winPct: 0,
    winRank: 1,
    headToHead: [],
    partnerRecords: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlayerProfile() {
      try {
        setError("");
        setLoading(true);

        const [
          playerData,
          gamesData,
          recordData,
        ] = await Promise.all([
          getPlayer(playerName),
          getPlayerGames(playerName),
          getPlayerRecord(playerName),
        ]);

        setPlayer(playerData);
        setPlayerGames(gamesData);
        setRecord(recordData);
      } catch (err) {
        console.error(
          "Player profile error:",
          err
        );

        setError(
          "Unable to load player profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlayerProfile();

    const interval = setInterval(
      loadPlayerProfile,
      30000
    );

    return () => clearInterval(interval);
  }, [playerName]);

  if (loading) {
    return (
      <p>
        Loading player profile...
      </p>
    );
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!player) {
    return <p>Player not found.</p>;
  }

  const playedGames =
    playerGames.filter(
      (game) =>
        Number(game.spins || 0) > 0 ||
        Number(game.points || 0) > 0
    );

  const sortedByPoints =
    [...playedGames].sort(
      (a, b) =>
        b.points - a.points
    );

  const bestGame =
    sortedByPoints.length > 0
      ? sortedByPoints[0]
      : null;

  const gamesWithPoints =
    playedGames.filter(
      (game) =>
        game.points > 0
    );

  const worstGame =
    gamesWithPoints.length > 0
      ? [...gamesWithPoints].sort(
          (a, b) =>
            a.points - b.points
        )[0]
      : null;

  const totalGamePoints =
    playedGames.reduce(
      (total, game) =>
        total + game.points,
      0
    );

  const totalGameSpins =
    playedGames.reduce(
      (total, game) =>
        total + game.spins,
      0
    );

  const averagePointsPerGame =
    playedGames.length > 0
      ? totalGamePoints /
        playedGames.length
      : 0;

  return (
    <div>
      <button
        onClick={() =>
          navigate("/")
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
          color: "#ffffff",
        }}
      >
        👤 {player.player}
      </h1>

      <p
        style={{
          color: "#3fb950",
          marginTop: 0,
          marginBottom: "14px",
          fontWeight: "bold",
        }}
      >
        ● LIVE
      </p>

      <button
        onClick={() =>
          navigate(
            `/players/${encodeURIComponent(
              player.player
            )}/schedule`
          )
        }
        style={{
          width: "100%",
          backgroundColor: "#21262d",
          color: "#ffffff",
          border: "1px solid #30363d",
          borderRadius: "12px",
          padding: "14px",
          marginBottom: "20px",
          cursor: "pointer",
          fontSize: "15px",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        📅 View My Schedule
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <RecordBox
          label="Record"
          value={`${record.wins}-${record.losses}`}
        />

        <RecordBox
          label="Win %"
          value={formatWinPct(
            record.winPct
          )}
        />

        <RecordBox
          label="Win Rank"
          value={`#${record.winRank}`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <StatBox
          label="Standing"
          value={
            player.standings
              ? `#${player.standings}`
              : "-"
          }
        />

        <StatBox
          label="Points"
          value={Number(
            player.points || 0
          ).toLocaleString()}
        />

        <StatBox
          label="Spin Rank"
          value={
            player.spinRank
              ? `#${player.spinRank}`
              : "-"
          }
        />

        <StatBox
          label="Spins"
          value={player.spins || 0}
        />

        <StatBox
          label="SPG"
          value={formatStat(
            player.spinsPerGame
          )}
        />

        <StatBox
          label="PPS"
          value={formatStat(
            player.pointsPerSpin
          )}
        />

        <StatBox
          label="100s"
          value={player.hundreds || 0}
        />

        <StatBox
          label="Year"
          value={player.year || 2026}
        />
      </div>

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "14px",
          padding: "18px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#ffffff",
          }}
        >
          📊 Weekend Summary
        </h2>

        <SummaryRow
          label="Best Game"
          value={
            bestGame
              ? `${bestGame.game} (${bestGame.points} pts)`
              : "-"
          }
        />

        <SummaryRow
          label="Worst Scoring Game"
          value={
            worstGame
              ? `${worstGame.game} (${worstGame.points} pts)`
              : "-"
          }
        />

        <SummaryRow
          label="Game Spins"
          value={totalGameSpins}
        />

        <SummaryRow
          label="Average Points / Game"
          value={
            averagePointsPerGame.toFixed(1)
          }
        />
      </div>

      <RelationshipSection
        icon="⚔️"
        title="Head-to-Head"
        emptyText="No completed head-to-head matchups yet."
        records={record.headToHead}
        prefix="vs"
      />

      <RelationshipSection
        icon="🤝"
        title="Partner Records"
        emptyText="No completed team matchups yet."
        records={record.partnerRecords}
        prefix="with"
      />

      <div
        style={{
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "14px",
          padding: "18px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#ffffff",
          }}
        >
          🎯 Game Breakdown
        </h2>

        {games.map((game) => {
          const stats =
            playerGames.find(
              (item) =>
                item.game ===
                game.name
            );

          return (
            <div
              key={game.id}
              onClick={() =>
                navigate(
                  `/games/${game.id}`,
                  {
                    state: {
                      fromPlayer:
                        `/players/${encodeURIComponent(
                          player.player
                        )}`,
                    },
                  }
                )
              }
              style={{
                padding: "14px 0",
                borderBottom:
                  "1px solid #30363d",
                cursor: "pointer",
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
                }}
              >
                <strong
                  style={{
                    color:
                      "#ffffff",
                  }}
                >
                  {game.icon}{" "}
                  {game.name}
                </strong>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <strong
                    style={{
                      color:
                        "#f2cc60",
                    }}
                  >
                    {stats
                      ? `${stats.points.toLocaleString()} pts`
                      : "0 pts"}
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
              </div>

              <div
                style={{
                  display:
                    "flex",
                  gap: "16px",
                  marginTop: "6px",
                  color:
                    "#8b949e",
                  fontSize: "13px",
                }}
              >
                <span>
                  🎡{" "}
                  {stats
                    ? stats.spins
                    : 0}{" "}
                  Spins
                </span>

                <span>
                  SV:{" "}
                  {stats
                    ? stats.spinValue
                    : 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RelationshipSection({
  icon,
  title,
  records,
  prefix,
  emptyText,
}) {
  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "20px",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          color: "#ffffff",
        }}
      >
        {icon} {title}
      </h2>

      {records.length === 0 ? (
        <p
          style={{
            color: "#8b949e",
            marginBottom: 0,
          }}
        >
          {emptyText}
        </p>
      ) : (
        records.map(
          (item, index) => (
            <div
              key={`${title}-${item.player}`}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr auto auto",
                alignItems: "center",
                gap: "12px",
                padding: "11px 0",
                borderBottom:
                  index ===
                  records.length - 1
                    ? "none"
                    : "1px solid #30363d",
              }}
            >
              <strong
                style={{
                  color: "#ffffff",
                }}
              >
                <span
                  style={{
                    color: "#8b949e",
                    fontWeight: "normal",
                    marginRight: "5px",
                  }}
                >
                  {prefix}
                </span>

                {item.player}
              </strong>

              <strong
                style={{
                  color: "#f2cc60",
                  whiteSpace: "nowrap",
                }}
              >
                {item.wins}-{item.losses}
              </strong>

              <span
                style={{
                  color: "#8b949e",
                  minWidth: "48px",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatWinPct(
                  item.winPct
                )}
              </span>
            </div>
          )
        )
      )}
    </div>
  );
}

function RecordBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "12px",
        padding: "12px 8px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "block",
          color: "#8b949e",
          fontSize: "11px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "7px",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: "#ffffff",
          fontSize: "18px",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function StatBox({
  label,
  value,
}) {
  return (
    <div
      style={{
        backgroundColor:
          "#21262d",
        border:
          "1px solid #30363d",
        borderRadius: "12px",
        padding: "14px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#8b949e",
          fontSize: "13px",
        }}
      >
        {label}
      </p>

      <h2
        style={{
          margin:
            "6px 0 0 0",
          fontSize: "22px",
          color: "#ffffff",
        }}
      >
        {value}
      </h2>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        gap: "20px",
        padding: "10px 0",
        borderBottom:
          "1px solid #30363d",
      }}
    >
      <span
        style={{
          color: "#8b949e",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          textAlign: "right",
          color: "#ffffff",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatStat(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.000";
  }

  return number.toFixed(3);
}

function formatWinPct(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "0.0%";
  }

  return `${(number * 100).toFixed(1)}%`;
}

export default PlayerProfile;