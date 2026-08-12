import { getCurrentGameMatchups } from "./currentGame";
import { getCaptainGames } from "./captains";
import { getPlayers } from "./players";

const EXCLUDED_GAMES = new Set([
  "Fuck Yeah",
  "Mouse Trap",
  "Liars Dice",
  "Elimination Chamber",
  "Unluckiest",
]);

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function splitTeam(team) {
  return String(team || "")
    .split("/")
    .map((name) => name.trim())
    .filter(Boolean);
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

function ensureRecord(records, playerName) {
  const normalized = normalizeName(playerName);

  if (!normalized) {
    return null;
  }

  if (!records[normalized]) {
    records[normalized] = {
      player: String(playerName).trim(),
      wins: 0,
      losses: 0,
      headToHead: {},
      partnerRecords: {},
    };
  }

  return records[normalized];
}

function ensureRelationshipRecord(
  relationshipMap,
  playerName
) {
  const normalized = normalizeName(playerName);

  if (!normalized) {
    return null;
  }

  if (!relationshipMap[normalized]) {
    relationshipMap[normalized] = {
      player: String(playerName).trim(),
      wins: 0,
      losses: 0,
    };
  }

  return relationshipMap[normalized];
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
  teammates.forEach((playerName) => {
    const playerRecord =
      ensureRecord(records, playerName);

    if (!playerRecord) {
      return;
    }

    teammates.forEach((partnerName) => {
      if (
        normalizeName(partnerName) ===
        normalizeName(playerName)
      ) {
        return;
      }

      addRelationshipResult(
        playerRecord.partnerRecords,
        partnerName,
        won
      );
    });
  });
}

function addHeadToHeadResults(
  records,
  team1Players,
  team2Players,
  winnerSide
) {
  team1Players.forEach((playerName) => {
    const playerRecord =
      ensureRecord(records, playerName);

    if (!playerRecord) {
      return;
    }

    team2Players.forEach((opponentName) => {
      addRelationshipResult(
        playerRecord.headToHead,
        opponentName,
        winnerSide === 1
      );
    });
  });

  team2Players.forEach((playerName) => {
    const playerRecord =
      ensureRecord(records, playerName);

    if (!playerRecord) {
      return;
    }

    team1Players.forEach((opponentName) => {
      addRelationshipResult(
        playerRecord.headToHead,
        opponentName,
        winnerSide === 2
      );
    });
  });
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

  const team1Players = splitTeam(team1);
  const team2Players = splitTeam(team2);

  team1Players.forEach((playerName) => {
    const record =
      ensureRecord(records, playerName);

    if (!record) {
      return;
    }

    if (winnerSide === 1) {
      record.wins += 1;
    } else {
      record.losses += 1;
    }
  });

  team2Players.forEach((playerName) => {
    const record =
      ensureRecord(records, playerName);

    if (!record) {
      return;
    }

    if (winnerSide === 2) {
      record.wins += 1;
    } else {
      record.losses += 1;
    }
  });

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
  return Object.values(
    relationshipMap
  )
    .map((record) => {
      const gamesPlayed =
        record.wins + record.losses;

      const winPct =
        gamesPlayed > 0
          ? record.wins / gamesPlayed
          : 0;

      return {
        ...record,
        gamesPlayed,
        winPct,
      };
    })
    .sort((a, b) => {
      if (b.gamesPlayed !== a.gamesPlayed) {
        return b.gamesPlayed - a.gamesPlayed;
      }

      if (b.winPct !== a.winPct) {
        return b.winPct - a.winPct;
      }

      return a.player.localeCompare(
        b.player
      );
    });
}

function finalizeRecords(records) {
  const values = Object.values(records).map(
    (record) => {
      const gamesPlayed =
        record.wins + record.losses;

      const winPct =
        gamesPlayed > 0
          ? record.wins / gamesPlayed
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

  return values.map((record) => {
    const winRank =
      1 +
      values.filter(
        (other) =>
          other.winPct > record.winPct
      ).length;

    return {
      ...record,
      winRank,
    };
  });
}

export async function getAllPlayerRecords() {
  const [
    matchups,
    captainGames,
    players,
  ] = await Promise.all([
    getCurrentGameMatchups(),
    getCaptainGames(),
    getPlayers(),
  ]);

  const records = {};

  players.forEach((player) => {
    ensureRecord(
      records,
      player.player
    );
  });

  matchups.forEach((matchup) => {
    if (
      EXCLUDED_GAMES.has(matchup.game)
    ) {
      return;
    }

    const winnerSide =
      getWinnerSide(
        matchup.score1,
        matchup.score2
      );

    applyResult(
      records,
      matchup.team1,
      matchup.team2,
      winnerSide
    );
  });

  captainGames.forEach((game) => {
    const winnerSide =
      getWinnerSide(
        game.score1,
        game.score2
      );

    if (!winnerSide) {
      return;
    }

    const team1 = [
      game.captain1,
      ...(game.picks1 || []),
    ]
      .filter(Boolean)
      .join(" / ");

    const team2 = [
      game.captain2,
      ...(game.picks2 || []),
    ]
      .filter(Boolean)
      .join(" / ");

    applyResult(
      records,
      team1,
      team2,
      winnerSide
    );
  });

  return finalizeRecords(records);
}

export async function getPlayerRecord(
  playerName
) {
  const records =
    await getAllPlayerRecords();

  const normalized =
    normalizeName(playerName);

  return (
    records.find(
      (record) =>
        normalizeName(record.player) ===
        normalized
    ) || {
      player: playerName,
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