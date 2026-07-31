export async function getPlayers() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=340245028&single=true&output=csv";

  const response = await fetch(url);
  const csv = await response.text();

  const rows = csv.trim().split("\n");
  rows.shift();

  return rows.map((row) => {
    const [
      player,
      standings,
      points,
      spinRank,
      spins,
      pointsPerSpin,
      hundreds,
      year,
    ] = row.split(",");

    return {
      player,
      standings: Number(standings),
      points: Number(points),
      spinRank: Number(spinRank),
      spins: Number(spins),
      pointsPerSpin: Number(pointsPerSpin),
      hundreds: Number(hundreds),
      year: Number(year),
    };
  });
}

export async function getPlayer(playerName) {
  const players = await getPlayers();

  return players.find(
    (player) =>
      player.player.toLowerCase() === decodeURIComponent(playerName).toLowerCase()
  );
}