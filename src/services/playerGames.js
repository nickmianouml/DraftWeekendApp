const PLAYER_GAMES_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=40128446&single=true&output=csv";

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

export async function getPlayerGames(playerName) {
  const response = await fetch(PLAYER_GAMES_URL);

  if (!response.ok) {
    throw new Error("Unable to load player game data.");
  }

  const csv = await response.text();

  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  rows.shift();

  const decodedName = decodeURIComponent(playerName).toLowerCase();

  return rows
    .filter((row) => {
      return (
        row.length >= 5 &&
        row[0] &&
        row[0].trim().toLowerCase() === decodedName
      );
    })
    .map((row) => ({
      player: row[0].trim(),
      game: row[1].trim(),
      spins: Number(row[2]) || 0,
      spinValue: Number(row[3]) || 0,
      points: Number(row[4]) || 0,
    }));
}