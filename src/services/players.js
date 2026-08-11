const PLAYERS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=340245028&single=true&output=csv";

export async function getPlayers() {
  const response = await fetch(PLAYERS_URL);

  if (!response.ok) {
    throw new Error("Unable to load player data.");
  }

  const csv = await response.text();

  const rows = csv.trim().split(/\r?\n/);

  rows.shift();

  return rows
    .filter((row) => row.trim() !== "")
    .map((row) => {
      const [
        player,
        standings,
        points,
        spinRank,
        spins,
        spg,
        pps,
        hundreds,
        year,
      ] = row.split(",");

      return {
        player: player.trim(),
        standings: Number(standings),
        points: Number(points),
        spinRank: Number(spinRank),
        spins: Number(spins),
        spinsPerGame: Number(spg),
        pointsPerSpin: Number(pps),
        hundreds: Number(hundreds),
        year: Number(year),
      };
    });
}

export async function getPlayer(playerName) {
  const players = await getPlayers();

  const decodedPlayerName =
    decodeURIComponent(playerName);

  return players.find(
    (player) =>
      player.player.toLowerCase() ===
      decodedPlayerName.toLowerCase()
  );
}