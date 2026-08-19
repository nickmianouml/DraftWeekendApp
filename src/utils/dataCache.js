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

  return Date.now() - entry.timestamp;
}

export function isCacheFresh(key, ttl) {
  const entry = cache.get(key);

  if (!entry) {
    return false;
  }

  if (ttl === Infinity) {
    return true;
  }

  return Date.now() - entry.timestamp < ttl;
}

export async function getCachedData(
  key,
  loader,
  {
    ttl = 30000,
    force = false,
  } = {}
) {
  const existing = cache.get(key);

  if (
    !force &&
    existing &&
    (
      ttl === Infinity ||
      Date.now() - existing.timestamp < ttl
    )
  ) {
    return existing.value;
  }

  const activeRequest = inFlight.get(key);

  if (activeRequest) {
    return activeRequest;
  }

  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      cache.set(key, {
        value,
        timestamp: Date.now(),
      });

      return value;
    })
    .finally(() => {
      if (inFlight.get(key) === request) {
        inFlight.delete(key);
      }
    });

  inFlight.set(key, request);

  return request;
}

export function setCachedData(key, value) {
  cache.set(key, {
    value,
    timestamp: Date.now(),
  });

  return value;
}

export function clearCachedData(key) {
  if (key) {
    cache.delete(key);
    inFlight.delete(key);
    return;
  }

  cache.clear();
  inFlight.clear();
}