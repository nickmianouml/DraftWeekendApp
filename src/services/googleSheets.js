export async function getStandings() {
  const url =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=801581888&single=true&output=csv";

  const response = await fetch(url);
  const csv = await response.text();

  const rows = csv.trim().split("\n");

  rows.shift();

  return rows.map((row) => {
    const [rank, player, points, spins, pps] = row.split(",");

    return {
      rank: Number(rank),
      player,
      points: Number(points),
      spins: Number(spins),
      pointsPerSpin: Number(pps),
    };
  });
}