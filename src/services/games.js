import {
  getCachedData,
} from "../utils/dataCache";

import {
  cleanCsvValue,
  fetchCsvRows,
  normalizeCsvValue,
} from "./csv";

const PLAYER_GAMES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=40128446&single=true&output=csv";

const PLAYER_GAMES_CACHE_KEY =
  "source:player-games";

const SOURCE_TTL =
  10000;

const REQUEST_TIMEOUT =
  8000;

async function loadGamesData() {
  const rows =
    await fetchCsvRows(
      PLAYER_GAMES_URL,
      "Unable to load game data."
    );

  return rows
    .filter(
      (row) =>
        row.length >= 5 &&
        cleanCsvValue(
          row[0]
        ) &&
        cleanCsvValue(
          row[1]
        )
    )
    .map((row) => ({
      player:
        cleanCsvValue(
          row[0]
        ),

      game:
        cleanCsvValue(
          row[1]
        ),

      spins:
        Number(
          cleanCsvValue(
            row[2]
          )
        ) || 0,

      spinValue:
        Number(
          cleanCsvValue(
            row[3]
          )
        ) || 0,

      points:
        Number(
          cleanCsvValue(
            row[4]
          )
        ) || 0,
    }));
}

export async function getGamesData() {
  return getCachedData(
    PLAYER_GAMES_CACHE_KEY,
    loadGamesData,
    {
      ttl:
        SOURCE_TTL,

      timeout:
        REQUEST_TIMEOUT,
    }
  );
}

export async function getGameData(
  gameName
) {
  const games =
    await getGamesData();

  const targetGame =
    normalizeCsvValue(
      gameName
    );

  return games
    .filter(
      (row) =>
        normalizeCsvValue(
          row.game
        ) ===
        targetGame
    )
    .sort(
      (a, b) =>
        b.points -
        a.points
    );
}