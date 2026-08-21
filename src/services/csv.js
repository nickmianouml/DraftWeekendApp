function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (character === '"') {
      if (
        insideQuotes &&
        line[index + 1] === '"'
      ) {
        current += '"';
        index += 1;
      } else {
        insideQuotes =
          !insideQuotes;
      }
    } else if (
      character === "," &&
      !insideQuotes
    ) {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  values.push(current);

  return values;
}

export function cleanCsvValue(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

export function normalizeCsvValue(
  value
) {
  return cleanCsvValue(
    value
  ).toLowerCase();
}

export async function fetchCsvRows(
  url,
  errorMessage =
    "Unable to load data.",
  {
    includeHeader = false,
  } = {}
) {
  const separator =
    url.includes("?")
      ? "&"
      : "?";

  const response =
    await fetch(
      `${url}${separator}cache=${Date.now()}`,
      {
        cache: "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      errorMessage
    );
  }

  const csv =
    await response.text();

  if (!csv.trim()) {
    return [];
  }

  const rows =
    csv
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map(parseCsvLine);

  if (
    !includeHeader
  ) {
    rows.shift();
  }

  return rows;
}