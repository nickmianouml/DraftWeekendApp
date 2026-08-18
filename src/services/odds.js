const ODDS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1015029653&single=true&output=csv";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
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

function clean(value) {
  return String(value ?? "").trim();
}

export async function getOdds() {
  const separator =
    ODDS_URL.includes("?")
      ? "&"
      : "?";

  const response = await fetch(
    `${ODDS_URL}${separator}cache=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load odds."
    );
  }

  const csv =
    await response.text();

  if (!csv.trim()) {
    return [];
  }

  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  rows.shift();

  return rows
    .filter(
      (row) =>
        clean(row[0]) &&
        clean(row[1])
    )
    .map((row) => ({
      type:
        clean(row[0]),

      game:
        clean(row[1]),

      team1:
        clean(row[2]),

      team2:
        clean(row[3]),

      odds1:
        clean(row[4]),

      odds2:
        clean(row[5]),

      player1:
        clean(row[6]),

      player2:
        clean(row[7]),

      outrightOdds:
        clean(row[8]),
    }));
}

export async function getOddsForGame(
  gameName
) {
  const odds =
    await getOdds();

  const target =
    String(gameName || "")
      .trim()
      .toLowerCase();

  return odds.filter(
    (item) =>
      String(item.game || "")
        .trim()
        .toLowerCase() ===
      target
  );
}

export function formatAmericanOdds(
  value
) {
  const raw =
    String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  const number =
    Number(raw);

  if (Number.isNaN(number)) {
    return raw;
  }

  if (number > 0) {
    return `+${number}`;
  }

  return String(number);
}