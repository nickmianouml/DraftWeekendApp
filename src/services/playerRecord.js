import {
  getCurrentGameMatchups,
} from "./currentGame";

import {
  getCaptainGames,
} from "./captains";

import {
  getPlayers,
} from "./players";

const EXCLUDED_GAMES =
  new Set([
    "Fuck Yeah",
    "Mouse Trap",
    "Liars Dice",
    "Elimination Chamber",
    "Unluckiest",
  ]);

function normalizeName(value) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function splitTeam(team) {
  return String(
    team ?? ""
  )
    .split("/")
    .map((name) =>
      name.trim()
    )
    .filter(Boolean);
}

function getWinnerSide(
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

function createRelationshipRecord(
  playerName
) {
  return {
    player:
      String(
        playerName ?? ""
      ).trim(),

    wins: 0,
    losses: 0,
  };
}

function createPlayerRecord(
  playerName
) {
  return {
    player:
      String(
        playerName ?? ""
      ).trim(),

    wins: 0,
    losses: 0,

    headToHead:
      new Map(),

    partnerRecords:
      new Map(),
  };
}

function ensureRecord(
  records,
  playerName
) {
  const normalized =
    normalizeName(
      playerName
    );

  if (!normalized) {
    return null;
  }

  if (
    !records.has(
      normalized
    )
  ) {
    records.set(
      normalized,
      createPlayerRecord(
        playerName
      )
    );
  }

  return records.get(
    normalized
  );
}

function ensureRelationshipRecord(
  relationshipMap,
  playerName
) {
  const normalized =
    normalizeName(
      playerName
    );

  if (!normalized) {
    return null;
  }

  if (
    !relationshipMap.has(
      normalized
    )
  ) {
    relationshipMap.set(
      normalized,
      createRelationshipRecord(
        playerName
      )
    );
  }

  return relationshipMap.get(
    normalized
  );
}

function addRelationshipResult(
  relationshipMap,
  otherPlayer,
  won
) {
  const record =
    ensureRelationshipRecord(
      relationshipMap,
      otherPlayer
    );

  if (!record) {
    return;
  }

  if (won) {
    record.wins += 1;
  } else {
    record.losses += 1;
  }
}

function addPartnerResults(
  records,
  teammates,
  won
) {
  const normalizedPlayers =
    teammates.map(
      (playerName) => ({
        playerName,
        normalized:
          normalizeName(
            playerName
          ),
      })
    );

  normalizedPlayers.forEach(
    ({
      playerName,
      normalized,
    }) => {
      const playerRecord =
        ensureRecord(
          records,
          playerName
        );

      if (
        !playerRecord
      ) {
        return;
      }

      normalizedPlayers.forEach(
        ({
          playerName:
            partnerName,
          normalized:
            partnerNormalized,
        }) => {
          if (
            partnerNormalized ===
            normalized
          ) {
            return;
          }

          addRelationshipResult(
            playerRecord.partnerRecords,
            partnerName,
            won
          );
        }
      );
    }
  );
}

function addHeadToHeadResults(
  records,
  team1Players,
  team2Players,
  winnerSide
) {
  team1Players.forEach(
    (playerName) => {
      const playerRecord =
        ensureRecord(
          records,
          playerName
        );

      if (
        !playerRecord
      ) {
        return;
      }

      team2Players.forEach(
        (opponentName) => {
          addRelationshipResult(
            playerRecord.headToHead,
            opponentName,
            winnerSide === 1
          );
        }
      );
    }
  );

  team2Players.forEach(
    (playerName) => {
      const playerRecord =
        ensureRecord(
          records,
          playerName
        );

      if (
        !playerRecord
      ) {
        return;
      }

      team1Players.forEach(
        (opponentName) => {
          addRelationshipResult(
            playerRecord.headToHead,
            opponentName,
            winnerSide === 2
          );
        }
      );
    }
  );
}

function addTeamResult(
  records,
  players,
  won
) {
  players.forEach(
    (playerName) => {
      const record =
        ensureRecord(
          records,
          playerName
        );

      if (!record) {
        return;
      }

      if (won) {
        record.wins += 1;
      } else {
        record.losses += 1;
      }
    }
  );
}

function applyResult(
  records,
  team1,
  team2,
  winnerSide
) {
  if (!winnerSide) {
    return;
  }

  const team1Players =
    splitTeam(team1);

  const team2Players =
    splitTeam(team2);

  addTeamResult(
    records,
    team1Players,
    winnerSide === 1
  );

  addTeamResult(
    records,
    team2Players,
    winnerSide === 2
  );

  addHeadToHeadResults(
    records,
    team1Players,
    team2Players,
    winnerSide
  );

  addPartnerResults(
    records,
    team1Players,
    winnerSide === 1
  );

  addPartnerResults(
    records,
    team2Players,
    winnerSide === 2
  );
}

function finalizeRelationshipRecords(
  relationshipMap
) {
  return [
    ...relationshipMap.values(),
  ]
    .map((record) => {
      const gamesPlayed =
        record.wins +
        record.losses;

      const winPct =
        gamesPlayed > 0
          ? record.wins /
            gamesPlayed
          : 0;

      return {
        ...record,
        gamesPlayed,
        winPct,
      };
    })
    .sort(
      (a, b) => {
        if (
          b.gamesPlayed !==
          a.gamesPlayed
        ) {
          return (
            b.gamesPlayed -
            a.gamesPlayed
          );
        }

        if (
          b.winPct !==
          a.winPct
        ) {
          return (
            b.winPct -
            a.winPct
          );
        }

        return (
          a.player.localeCompare(
            b.player
          )
        );
      }
    );
}

function finalizeRecords(
  records
) {
  const values =
    [
      ...records.values(),
    ].map(
      (record) => {
        const gamesPlayed =
          record.wins +
          record.losses;

        const winPct =
          gamesPlayed > 0
            ? record.wins /
              gamesPlayed
            : 0;

        return {
          ...record,
          gamesPlayed,
          winPct,

          headToHead:
            finalizeRelationshipRecords(
              record.headToHead
            ),

          partnerRecords:
            finalizeRelationshipRecords(
              record.partnerRecords
            ),
        };
      }
    );

  const uniqueWinPcts =
    [
      ...new Set(
        values.map(
          (record) =>
            record.winPct
        )
      ),
    ].sort(
      (a, b) =>
        b - a
    );

  const rankByWinPct =
    new Map();

  uniqueWinPcts.forEach(
    (
      winPct,
      index
    ) => {
      const higherCount =
        values.filter(
          (record) =>
            record.winPct >
            winPct
        ).length;

      rankByWinPct.set(
        winPct,
        higherCount + 1
      );
    }
  );

  return values.map(
    (record) => ({
      ...record,

      winRank:
        rankByWinPct.get(
          record.winPct
        ) || 1,
    })
  );
}

function buildCaptainTeam(
  captain,
  picks
) {
  return [
    captain,
    ...(picks || []),
  ]
    .filter(Boolean)
    .join(" / ");
}

export async function getAllPlayerRecords() {
  const [
    matchups,
    captainGames,
    players,
  ] =
    await Promise.all([
      getCurrentGameMatchups(),
      getCaptainGames(),
      getPlayers(),
    ]);

  const records =
    new Map();

  players.forEach(
    (player) => {
      ensureRecord(
        records,
        player.player
      );
    }
  );

  matchups.forEach(
    (matchup) => {
      if (
        EXCLUDED_GAMES.has(
          matchup.game
        )
      ) {
        return;
      }

      applyResult(
        records,
        matchup.team1,
        matchup.team2,
        getWinnerSide(
          matchup.score1,
          matchup.score2
        )
      );
    }
  );

  captainGames.forEach(
    (game) => {
      const winnerSide =
        getWinnerSide(
          game.score1,
          game.score2
        );

      if (
        !winnerSide
      ) {
        return;
      }

      applyResult(
        records,

        buildCaptainTeam(
          game.captain1,
          game.picks1
        ),

        buildCaptainTeam(
          game.captain2,
          game.picks2
        ),

        winnerSide
      );
    }
  );

  return finalizeRecords(
    records
  );
}

export async function getPlayerRecord(
  playerName
) {
  const records =
    await getAllPlayerRecords();

  const normalized =
    normalizeName(
      playerName
    );

  return (
    records.find(
      (record) =>
        normalizeName(
          record.player
        ) ===
        normalized
    ) || {
      player:
        playerName,

      wins: 0,
      losses: 0,
      gamesPlayed: 0,
      winPct: 0,
      winRank: 1,

      headToHead: [],
      partnerRecords: [],
    }
  );
}