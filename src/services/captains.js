const CAPTAINS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=225509487&single=true&output=csv";

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

export async function getCaptainGames() {
  const separator = CAPTAINS_URL.includes("?") ? "&" : "?";

  const response = await fetch(
    `${CAPTAINS_URL}${separator}cache=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load captain game data.");
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

      captain1: row[1]?.trim() || "",
      captain2: row[2]?.trim() || "",

      picks1: [
        row[3]?.trim() || "",
        row[5]?.trim() || "",
        row[7]?.trim() || "",
        row[9]?.trim() || "",
        row[11]?.trim() || "",
        row[13]?.trim() || "",
      ],

      picks2: [
        row[4]?.trim() || "",
        row[6]?.trim() || "",
        row[8]?.trim() || "",
        row[10]?.trim() || "",
        row[12]?.trim() || "",
        row[14]?.trim() || "",
      ],

      score1: row[15]?.trim() || "",
      score2: row[16]?.trim() || "",

      status: row[17]?.trim() || "Not Started",
    }));
}

export async function getCaptainGame(gameName) {
  const games = await getCaptainGames();

  return (
    games.find(
      (item) =>
        item.game.toLowerCase() === gameName.toLowerCase()
    ) || null
  );
}