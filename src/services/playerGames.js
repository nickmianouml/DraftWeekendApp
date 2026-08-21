import {
  getGamesData,
} from "./games";

function normalizeName(value) {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function getPlayerGames(
  playerName
) {
  const games =
    await getGamesData();

  const targetPlayer =
    normalizeName(
      decodeURIComponent(
        playerName || ""
      )
    );

  return games.filter(
    (game) =>
      normalizeName(
        game.player
      ) ===
      targetPlayer
  );
}