import {
  getCachedData,
} from "../utils/dataCache";

import {
  fetchCsvRows,
} from "./csv";

const LIVE_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRIeHL18j-kihduE5ChG91aJOdcFo78J7BjYJscs142FBzCT13WkrCT08B-h4KMY6ODVezjvn1H31iH/pub?gid=119967180&single=true&output=csv";

const LIVE_SHEET_CACHE_KEY =
  "source:live-sheet";

const SOURCE_TTL =
  10000;

const REQUEST_TIMEOUT =
  8000;

export async function getLiveSheetRows() {
  return getCachedData(
    LIVE_SHEET_CACHE_KEY,
    () =>
      fetchCsvRows(
        LIVE_URL,
        "Unable to load live data."
      ),
    {
      ttl:
        SOURCE_TTL,

      timeout:
        REQUEST_TIMEOUT,
    }
  );
}