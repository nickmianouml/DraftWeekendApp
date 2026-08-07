const LIVE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=119967180&single=true&output=csv";

export async function getLiveData() {
  const response = await fetch(LIVE_URL);

  if (!response.ok) {
    throw new Error("Unable to load live dashboard data.");
  }

  const csv = await response.text();

  const rows = csv
    .trim()
    .split(/\r?\n/);

  rows.shift();

  const liveData = {};

  rows.forEach((row) => {
    const commaIndex = row.indexOf(",");

    if (commaIndex === -1) {
      return;
    }

    const metric = row
      .slice(0, commaIndex)
      .replace(/^"|"$/g, "")
      .trim();

    const value = row
      .slice(commaIndex + 1)
      .replace(/^"|"$/g, "")
      .trim();

    liveData[metric] = value;
  });

  return liveData;
}