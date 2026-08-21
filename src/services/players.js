import {
  cleanCsvValue,
  fetchCsvRows,
  normalizeCsvValue,
} from "./csv";

const PLAYERS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=340245028&single=true&output=csv";

function toNumber(value) {
  return (
    Number(
      cleanCsvValue(
        value
      )
    ) || 0
  );
}

export async function getPlayers() {
  const rows =
    await fetchCsvRows(
      PLAYERS_URL,
      "Unable to load player data."
    );

  return rows
    .filter(
      (row) =>
        cleanCsvValue(
          row[0]
        )
    )
    .map((row) => ({
      player:
        cleanCsvValue(
          row[0]
        ),

      standings:
        toNumber(
          row[1]
        ),

      points:
        toNumber(
          row[2]
        ),

      spinRank:
        toNumber(
          row[3]
        ),

      spins:
        toNumber(
          row[4]
        ),

      spinsPerGame:
        toNumber(
          row[5]
        ),

      pointsPerSpin:
        toNumber(
          row[6]
        ),

      hundreds:
        toNumber(
          row[7]
        ),

      year:
        toNumber(
          row[8]
        ),
    }));
}

export async function getPlayer(
  playerName
) {
  const players =
    await getPlayers();

  const targetPlayer =
    normalizeCsvValue(
      decodeURIComponent(
        playerName || ""
      )
    );

  return players.find(
    (player) =>
      normalizeCsvValue(
        player.player
      ) ===
      targetPlayer
  );
}