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

  // Games such as Rock Paper Scissors
  // can use W / L instead of numeric scores.
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
    };
  }

  return records[normalized];
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

  const players1 = splitTeam(team1);
  const players2 = splitTeam(team2);

  players1.forEach((playerName) => {
    const record = ensureRecord(
      records,
      playerName
    );

    if (!record) {
      return;
    }

    if (winnerSide === 1) {
      record.wins += 1;
    } else {
      record.losses += 1;
    }
  });

  players2.forEach((playerName) => {
    const record = ensureRecord(
      records,
      playerName
    );

    if (!record) {
      return;
    }

    if (winnerSide === 2) {
      record.wins += 1;
    } else {
      record.losses += 1;
    }
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
      };
    }
  );

  return values.map((record) => {
    // Competition-style ranking:
    // everyone with the same winning %
    // receives the same rank.
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

  // Add every player first so someone who
  // hasn't completed a matchup yet still
  // receives a 0-0 record.
  players.forEach((player) => {
    ensureRecord(
      records,
      player.player
    );
  });

  // Regular matchup games, including
  // numeric-score games and W/L games.
  matchups.forEach((matchup) => {
    if (
      EXCLUDED_GAMES.has(matchup.game)
    ) {
      return;
    }

    const winnerSide = getWinnerSide(
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

  // Captain/team games.
  // Every member of the winning team gets
  // one win and every member of the losing
  // team gets one loss.
  captainGames.forEach((game) => {
    const winnerSide = getWinnerSide(
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
    }
  );
}