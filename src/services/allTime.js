import {
  cleanCsvValue,
  fetchCsvRows,
} from "./csv";

const ALL_TIME_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1700532631&single=true&output=csv";

function parseNumber(value) {
  const cleaned =
    cleanCsvValue(
      value
    )
      .replace(/,/g, "")
      .replace(/%/g, "");

  if (!cleaned) {
    return 0;
  }

  const number =
    Number(cleaned);

  return Number.isNaN(
    number
  )
    ? 0
    : number;
}

function parsePercent(value) {
  const raw =
    cleanCsvValue(
      value
    );

  if (!raw) {
    return 0;
  }

  const number =
    parseNumber(raw);

  if (
    raw.includes("%")
  ) {
    return number / 100;
  }

  if (
    number > 1
  ) {
    return number / 100;
  }

  return number;
}

function normalizeRow(row) {
  return {
    type:
      cleanCsvValue(
        row.Type
      ),

    player:
      cleanCsvValue(
        row.Player
      ),

    game:
      cleanCsvValue(
        row.Game
      ),

    years:
      parseNumber(
        row.Yrs
      ),

    championships:
      parseNumber(
        row["1sts"]
      ),

    averageFinish:
      parseNumber(
        row["Avg Finish"]
      ),

    standing:
      parseNumber(
        row.Standing
      ),

    points:
      parseNumber(
        row.Points
      ),

    pointsPerYear:
      parseNumber(
        row.PPY
      ),

    spinRank:
      parseNumber(
        row["Spin Rank"]
      ),

    spins:
      parseNumber(
        row.Spins
      ),

    spinsPerYear:
      parseNumber(
        row.SPY
      ),

    spinsPerGame:
      parseNumber(
        row.SPG
      ),

    winPct:
      parsePercent(
        row["W%"]
      ),

    pointsPerSpin:
      parseNumber(
        row.PPS
      ),

    hundreds:
      parseNumber(
        row["100s"]
      ),

    wins:
      parseNumber(
        row.Ws
      ),

    losses:
      parseNumber(
        row.Ls
      ),

    spinValue:
      parseNumber(
        row.SV
      ),

    specialCount:
      parseNumber(
        row["Special Count"]
      ),

    specialValue:
      parseNumber(
        row["Special Value"]
      ),

    notes:
      cleanCsvValue(
        row.Notes
      ),
  };
}

export async function getAllTimeData() {
  const rows =
    await fetchCsvRows(
      ALL_TIME_URL,
      "Unable to load all-time statistics.",
      {
        includeHeader: true,
      }
    );

  if (
    rows.length === 0
  ) {
    return {
      overall: [],
      games: [],
      specials: [],
    };
  }

  const headers =
    rows[0].map(
      cleanCsvValue
    );

  const data =
    rows
      .slice(1)
      .map(
        (values) => {
          const row = {};

          headers.forEach(
            (
              header,
              index
            ) => {
              row[header] =
                values[index] ??
                "";
            }
          );

          return normalizeRow(
            row
          );
        }
      )
      .filter(
        (row) =>
          row.player
      );

  return {
    overall:
      data.filter(
        (row) =>
          row.type ===
          "Overall"
      ),

    games:
      data.filter(
        (row) =>
          row.type ===
          "Game"
      ),

    specials:
      data.filter(
        (row) =>
          row.type ===
          "Special"
      ),
  };
}