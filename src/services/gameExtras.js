import {
  cleanCsvValue,
  fetchCsvRows,
  normalizeCsvValue,
} from "./csv";

const GAME_EXTRAS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1291137974&single=true&output=csv";

export async function getGameExtras() {
  const rows =
    await fetchCsvRows(
      GAME_EXTRAS_URL,
      "Unable to load game extras."
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

      type:
        cleanCsvValue(
          row[1]
        ),

      number:
        cleanCsvValue(
          row[2]
        ),

      team1:
        cleanCsvValue(
          row[3]
        ),

      team2:
        cleanCsvValue(
          row[4]
        ),
    }));
}

export async function getExtrasForGame(
  gameName
) {
  const extras =
    await getGameExtras();

  const targetGame =
    normalizeCsvValue(
      gameName
    );

  return extras.filter(
    (item) =>
      normalizeCsvValue(
        item.game
      ) ===
      targetGame
  );
}