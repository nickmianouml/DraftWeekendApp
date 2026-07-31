export async function getHomeData() {
  const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=1354549032&single=true&output=csv";

  const response = await fetch(url);
  const csv = await response.text();

  const rows = csv.trim().split("\n");
  rows.shift();

  const home = {};

  rows.forEach((row) => {
    const [metric, value] = row.split(",");

    home[metric] = value;
  });

  return home;
}