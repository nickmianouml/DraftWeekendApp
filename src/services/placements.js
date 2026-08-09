const PLACEMENTS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=536299531&single=true&output=csv";

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

export async function getPlacements() {
  const separator = PLACEMENTS_URL.includes("?") ? "&" : "?";

  const response = await fetch(
    `${PLACEMENTS_URL}${separator}cache=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to load placement data.");
  }

  const csv = await response.text();

  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  rows.shift();

  return rows
    .filter((row) => row[0] && row[1])
    .map((row) => ({
      game: row[0]?.trim() || "",
      team: row[1]?.trim() || "",
      place: row[2]?.trim() || "",
      status: row[3]?.trim() || "Not Started",
    }));
}

export async function getPlacementsForGame(gameName) {
  const placements = await getPlacements();

  return placements.filter(
    (item) =>
      item.game.toLowerCase() === gameName.toLowerCase()
  );
}