import {
  cleanCsvValue,
  fetchCsvRows,
  normalizeCsvValue,
} from "./csv";

const PLACEMENTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=536299531&single=true&output=csv";

export async function getPlacements() {
  const rows =
    await fetchCsvRows(
      PLACEMENTS_URL,
      "Unable to load placement data."
    );

  return rows
    .filter(
      (row) =>
        cleanCsvValue(
          row[0]
        ) &&
        cleanCsvValue(
          row[1]
        )
    )
    .map((row) => ({
      game:
        cleanCsvValue(
          row[0]
        ),

      team:
        cleanCsvValue(
          row[1]
        ),

      place:
        cleanCsvValue(
          row[2]
        ),

      status:
        cleanCsvValue(
          row[3]
        ) ||
        "Not Started",
    }));
}

export async function getPlacementsForGame(
  gameName
) {
  const placements =
    await getPlacements();

  const targetGame =
    normalizeCsvValue(
      gameName
    );

  return placements.filter(
    (item) =>
      normalizeCsvValue(
        item.game
      ) ===
      targetGame
  );
}