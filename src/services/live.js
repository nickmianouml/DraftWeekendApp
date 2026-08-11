const LIVE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=119967180&single=true&output=csv";

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

export async function getLiveData() {
  const separator = LIVE_URL.includes("?") ? "&" : "?";

  const response = await fetch(
    `${LIVE_URL}${separator}cache=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load live dashboard data."
    );
  }

  const csv = await response.text();

  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

  rows.shift();

  const liveData = {};

  rows.forEach((row) => {
    const metric = row[0]?.trim();
    const value = row[1]?.trim();

    if (!metric) {
      return;
    }

    liveData[metric] = value || "";
  });

  return liveData;
}