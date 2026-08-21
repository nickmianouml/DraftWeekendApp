import {
  cleanCsvValue,
  fetchCsvRows,
  normalizeCsvValue,
} from "./csv";

const CURRENT_GAME_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1682749295&single=true&output=csv";

export async function getCurrentGameMatchups() {
  const rows =
    await fetchCsvRows(
      CURRENT_GAME_URL,
      "Unable to load current game matchups."
    );

  return rows
    .filter(
      (row) =>
        cleanCsvValue(
          row[0]
        ) &&
        cleanCsvValue(
          row[1]
        ) &&
        cleanCsvValue(
          row[2]
        )
    )
    .map((row) => ({
      game:
        cleanCsvValue(
          row[0]
        ),

      team1:
        cleanCsvValue(
          row[1]
        ),

      team2:
        cleanCsvValue(
          row[2]
        ),

      score1:
        cleanCsvValue(
          row[3]
        ),

      score2:
        cleanCsvValue(
          row[4]
        ),

      status:
        cleanCsvValue(
          row[5]
        ),
    }));
}

export async function getMatchupsForGame(
  gameName
) {
  const matchups =
    await getCurrentGameMatchups();

  const targetGame =
    normalizeCsvValue(
      gameName
    );

  return matchups.filter(
    (matchup) =>
      normalizeCsvValue(
        matchup.game
      ) ===
      targetGame
  );
}