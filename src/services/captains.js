import {
  cleanCsvValue,
  fetchCsvRows,
  normalizeCsvValue,
} from "./csv";

const CAPTAINS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=225509487&single=true&output=csv";

export async function getCaptainGames() {
  const rows =
    await fetchCsvRows(
      CAPTAINS_URL,
      "Unable to load captain game data."
    );

  return rows
    .filter(
      (row) =>
        cleanCsvValue(
          row[0]
        )
    )
    .map((row) => ({
      game:
        cleanCsvValue(
          row[0]
        ),

      captain1:
        cleanCsvValue(
          row[1]
        ),

      captain2:
        cleanCsvValue(
          row[2]
        ),

      picks1: [
        cleanCsvValue(
          row[3]
        ),
        cleanCsvValue(
          row[5]
        ),
        cleanCsvValue(
          row[7]
        ),
        cleanCsvValue(
          row[9]
        ),
        cleanCsvValue(
          row[11]
        ),
        cleanCsvValue(
          row[13]
        ),
      ],

      picks2: [
        cleanCsvValue(
          row[4]
        ),
        cleanCsvValue(
          row[6]
        ),
        cleanCsvValue(
          row[8]
        ),
        cleanCsvValue(
          row[10]
        ),
        cleanCsvValue(
          row[12]
        ),
        cleanCsvValue(
          row[14]
        ),
      ],

      score1:
        cleanCsvValue(
          row[15]
        ),

      score2:
        cleanCsvValue(
          row[16]
        ),

      status:
        cleanCsvValue(
          row[17]
        ) ||
        "Not Started",
    }));
}

export async function getCaptainGame(
  gameName
) {
  const games =
    await getCaptainGames();

  const targetGame =
    normalizeCsvValue(
      gameName
    );

  return (
    games.find(
      (item) =>
        normalizeCsvValue(
          item.game
        ) ===
        targetGame
    ) ||
    null
  );
}