const GAME_EXTRAS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1291137974&single=true&output=csv";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const character = line[i];

    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (character === "," && !insideQuotes) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current);

  return values;
}

export async function getGameExtras() {
  const separator = GAME_EXTRAS_URL.includes("?") ? "&" : "?";

  const response = await fetch(
    `${GAME_EXTRAS_URL}${separator}cache=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load game extras.");
  }

  const csv = await response.text();

  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  rows.shift();

  return rows
    .filter((row) => row[0])
    .map((row) => ({
      game: row[0]?.trim() || "",
      type: row[1]?.trim() || "",
      number: row[2]?.trim() || "",
      team1: row[3]?.trim() || "",
      team2: row[4]?.trim() || "",
    }));
}

export async function getExtrasForGame(gameName) {
  const extras = await getGameExtras();

  return extras.filter(
    (item) =>
      item.game.toLowerCase() === gameName.toLowerCase()
  );
}