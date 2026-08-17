const ALL_TIME_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1700532631&single=true&output=csv";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (character === '"') {
      if (
        insideQuotes &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
      }
    } else if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current);

  return values;
}

function parseNumber(value) {
  const cleaned = String(
    value ?? ""
  )
    .trim()
    .replace(/,/g, "")
    .replace(/%/g, "");

  if (!cleaned) {
    return 0;
  }

  const number =
    Number(cleaned);

  return Number.isNaN(number)
    ? 0
    : number;
}

function parsePercent(value) {
  const raw = String(
    value ?? ""
  ).trim();

  if (!raw) {
    return 0;
  }

  const number =
    parseNumber(raw);

  if (raw.includes("%")) {
    return number / 100;
  }

  if (number > 1) {
    return number / 100;
  }

  return number;
}

function normalizeRow(row) {
  return {
    type:
      row.Type || "",

    player:
      row.Player || "",

    game:
      row.Game || "",

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
      row.Notes || "",
  };
}

export async function getAllTimeData() {
  const separator =
    ALL_TIME_URL.includes("?")
      ? "&"
      : "?";

  const response =
    await fetch(
      `${ALL_TIME_URL}${separator}cache=${Date.now()}`,
      {
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to load all-time statistics."
    );
  }

  const csv =
    await response.text();

  const lines =
    csv
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);

  if (
    lines.length === 0
  ) {
    return {
      overall: [],
      games: [],
      specials: [],
    };
  }

  const headers =
    parseCsvLine(
      lines[0]
    ).map(
      (header) =>
        header.trim()
    );

  const rows =
    lines
      .slice(1)
      .map(parseCsvLine)
      .map((values) => {
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
      })
      .filter(
        (row) =>
          row.player
      );

  return {
    overall:
      rows.filter(
        (row) =>
          row.type ===
          "Overall"
      ),

    games:
      rows.filter(
        (row) =>
          row.type ===
          "Game"
      ),

    specials:
      rows.filter(
        (row) =>
          row.type ===
          "Special"
      ),
  };
}