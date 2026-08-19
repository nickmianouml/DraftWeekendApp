const cache = new Map();
const inFlight = new Map();

export function getCachedValue(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  return entry.value;
}

export function getCacheAge(key) {
  const entry = cache.get(key);

  if (!entry) {
    return Infinity;
  }

  return (
    Date.now() -
    entry.timestamp
  );
}

export function isCacheFresh(
  key,
  ttl
) {
  const entry = cache.get(key);

  if (!entry) {
    return false;
  }

  if (ttl === Infinity) {
    return true;
  }

  return (
    Date.now() -
      entry.timestamp <
    ttl
  );
}

function createTimeoutError(
  key,
  timeout
) {
  const error =
    new Error(
      `Request timed out after ${timeout}ms: ${key}`
    );

  error.name =
    "DataCacheTimeoutError";

  error.cacheKey = key;

  return error;
}

export async function getCachedData(
  key,
  loader,
  {
    ttl = 30000,
    force = false,
    timeout = null,
  } = {}
) {
  const existing =
    cache.get(key);

  /*
   * Return fresh cached data immediately.
   */
  if (
    !force &&
    existing &&
    (
      ttl === Infinity ||
      Date.now() -
        existing.timestamp <
        ttl
    )
  ) {
    return existing.value;
  }

  /*
   * If this exact request is already
   * running, reuse it.
   *
   * Importantly, timed-out requests are
   * removed from this map, so we can never
   * permanently attach ourselves to a
   * dead Promise.
   */
  const activeRequest =
    inFlight.get(key);

  if (activeRequest) {
    return activeRequest;
  }

  let timeoutId = null;

  const loaderPromise =
    Promise.resolve().then(
      () => loader()
    );

  let operation =
    loaderPromise;

  /*
   * A timeout does not mutate the service
   * itself. It simply stops this cache
   * request from waiting forever.
   *
   * Once timeout occurs, this request is
   * released from inFlight and a later
   * retry may make a fresh request.
   */
  if (
    Number.isFinite(timeout) &&
    timeout > 0
  ) {
    const timeoutPromise =
      new Promise(
        (_, reject) => {
          timeoutId =
            setTimeout(
              () => {
                reject(
                  createTimeoutError(
                    key,
                    timeout
                  )
                );
              },
              timeout
            );
        }
      );

    operation =
      Promise.race([
        loaderPromise,
        timeoutPromise,
      ]);
  }

  let request;

  request =
    operation
      .then((value) => {
        /*
         * Only a request that completed
         * before its timeout reaches here.
         *
         * A request that eventually returns
         * after timing out cannot overwrite
         * the cache.
         */
        cache.set(key, {
          value,
          timestamp:
            Date.now(),
        });

        return value;
      })
      .finally(() => {
        if (
          timeoutId !== null
        ) {
          clearTimeout(
            timeoutId
          );
        }

        /*
         * Only remove ourselves if this is
         * still the active request for the
         * key.
         */
        if (
          inFlight.get(key) ===
          request
        ) {
          inFlight.delete(
            key
          );
        }
      });

  inFlight.set(
    key,
    request
  );

  return request;
}

export function setCachedData(
  key,
  value
) {
  cache.set(key, {
    value,
    timestamp:
      Date.now(),
  });

  return value;
}

export function clearCachedData(
  key
) {
  if (key) {
    cache.delete(key);
    inFlight.delete(key);

    return;
  }

  cache.clear();
  inFlight.clear();
}