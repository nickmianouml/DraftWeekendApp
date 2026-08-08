const CURRENT_GAME_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1682749295&single=true&output=csv";

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

export async function getCurrentGameMatchups() {
  const separator = CURRENT_GAME_URL.includes("?") ? "&" : "?";

  const response = await fetch(
    `${CURRENT_GAME_URL}${separator}cache=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load current game matchups.");
  }

  const csv = await response.text();

  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  rows.shift();

  return rows
    .filter((row) => row[0] && row[1] && row[2])
    .map((row) => ({
      game: row[0].trim(),
      team1: row[1]?.trim() || "",
      team2: row[2]?.trim() || "",
      score1: row[3]?.trim() || "",
      score2: row[4]?.trim() || "",
      status: row[5]?.trim() || "",
    }));
}

export async function getMatchupsForGame(gameName) {
  const matchups = await getCurrentGameMatchups();

  return matchups.filter(
    (matchup) =>
      matchup.game.toLowerCase() === gameName.toLowerCase()
  );
}