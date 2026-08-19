const LIVE_CACHE_MS = 30000;

/*
 * Odds effectively become static once entered.
 *
 * We keep them for the entire current app session.
 * Reloading or fully closing/reopening the app will
 * automatically fetch fresh odds again.
 */
const ODDS_GID = "1015029653";

const responseCache = new Map();
const inFlightRequests = new Map();

let installed = false;

function isGoogleSheetsCsv(url) {
  try {
    const parsedUrl = new URL(
      url,
      window.location.href
    );

    return (
      parsedUrl.hostname ===
        "docs.google.com" &&
      parsedUrl.pathname.includes(
        "/spreadsheets/d/e/"
      ) &&
      parsedUrl.searchParams.get(
        "output"
      ) === "csv"
    );
  } catch {
    return false;
  }
}

function normalizeGoogleSheetsUrl(
  url
) {
  const parsedUrl = new URL(
    url,
    window.location.href
  );

  /*
   * Your services currently append:
   *
   * &cache=Date.now()
   *
   * That intentionally creates a different URL
   * every time.
   *
   * Remove it here so requests for the same
   * spreadsheet tab share one cache entry.
   */
  parsedUrl.searchParams.delete(
    "cache"
  );

  return parsedUrl.toString();
}

function getCacheDuration(url) {
  try {
    const parsedUrl =
      new URL(url);

    const gid =
      parsedUrl.searchParams.get(
        "gid"
      );

    /*
     * Odds remain cached for the entire app
     * session.
     */
    if (gid === ODDS_GID) {
      return Infinity;
    }

    /*
     * All live/current data can be reused
     * for 30 seconds.
     */
    return LIVE_CACHE_MS;
  } catch {
    return LIVE_CACHE_MS;
  }
}

function createResponse(record) {
  return new Response(
    record.body,
    {
      status:
        record.status,

      statusText:
        record.statusText,

      headers:
        record.headers,
    }
  );
}

function createRecord(
  response,
  body
) {
  return {
    body,

    status:
      response.status,

    statusText:
      response.statusText,

    headers:
      Array.from(
        response.headers.entries()
      ),

    timestamp:
      Date.now(),
  };
}

function isCacheValid(
  record,
  duration
) {
  if (!record) {
    return false;
  }

  if (
    duration === Infinity
  ) {
    return true;
  }

  return (
    Date.now() -
      record.timestamp <
    duration
  );
}

export function clearGoogleSheetsCache() {
  responseCache.clear();
  inFlightRequests.clear();
}

export function installGoogleSheetsFetchCache() {
  if (
    installed ||
    typeof window ===
      "undefined" ||
    typeof window.fetch !==
      "function"
  ) {
    return;
  }

  installed = true;

  const originalFetch =
    window.fetch.bind(window);

  window.fetch =
    async function cachedFetch(
      input,
      init = {}
    ) {
      const requestUrl =
        typeof input ===
        "string"
          ? input
          : input?.url;

      /*
       * Only intercept the published Google
       * Sheets CSV APIs used by this app.
       *
       * All other fetch requests behave exactly
       * as they did previously.
       */
      if (
        !requestUrl ||
        !isGoogleSheetsCsv(
          requestUrl
        )
      ) {
        return originalFetch(
          input,
          init
        );
      }

      const method =
        String(
          init?.method ||
            (typeof input !==
              "string"
              ? input?.method
              : "GET") ||
            "GET"
        ).toUpperCase();

      /*
       * Never cache writes.
       */
      if (
        method !== "GET"
      ) {
        return originalFetch(
          input,
          init
        );
      }

      const normalizedUrl =
        normalizeGoogleSheetsUrl(
          requestUrl
        );

      const cacheDuration =
        getCacheDuration(
          normalizedUrl
        );

      const existingRecord =
        responseCache.get(
          normalizedUrl
        );

      if (
        isCacheValid(
          existingRecord,
          cacheDuration
        )
      ) {
        return createResponse(
          existingRecord
        );
      }

      /*
       * If another component/page is already
       * requesting this exact spreadsheet,
       * wait for that request rather than
       * starting another one.
       */
      const existingRequest =
        inFlightRequests.get(
          normalizedUrl
        );

      if (existingRequest) {
        const record =
          await existingRequest;

        return createResponse(
          record
        );
      }

      const requestPromise =
        (async () => {
          /*
           * Remove the service's no-store setting.
           *
           * Our application cache controls freshness,
           * so there is no reason to force iOS to
           * bypass every available network cache.
           */
          const fetchOptions = {
            ...init,
          };

          delete fetchOptions.cache;

          const response =
            await originalFetch(
              normalizedUrl,
              fetchOptions
            );

          const body =
            await response.text();

          const record =
            createRecord(
              response,
              body
            );

          /*
           * Only cache successful responses.
           *
           * A temporary Google Sheets error should
           * never become the cached response.
           */
          if (response.ok) {
            responseCache.set(
              normalizedUrl,
              record
            );
          }

          return record;
        })();

      inFlightRequests.set(
        normalizedUrl,
        requestPromise
      );

      try {
        const record =
          await requestPromise;

        return createResponse(
          record
        );
      } finally {
        inFlightRequests.delete(
          normalizedUrl
        );
      }
    };
}