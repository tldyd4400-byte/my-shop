type Gtag = (...args: unknown[]) => void;

type SessionStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type SessionEventInput = {
  key: string;
  eventName: "menu_view" | "story_read";
  pathname: string;
  getStorage: () => SessionStorage;
  getGtag: () => Gtag | undefined;
};

type RetryScheduler<T> = {
  setTimeout: (callback: () => void, delay: number) => T;
  clearTimeout: (handle: T) => void;
};

type RetryOptions = {
  delayMs?: number;
  retryLimit?: number;
};

declare global {
  interface Window {
    gtag?: Gtag;
  }
}

const deliveredKeys = new Set<string>();

export const ANALYTICS_RETRY_DELAY_MS = 500;
export const ANALYTICS_RETRY_LIMIT = 10;

export function deliverSessionEvent({
  key,
  eventName,
  pathname,
  getStorage,
  getGtag,
}: SessionEventInput): boolean {
  if (deliveredKeys.has(key)) {
    return true;
  }

  let storage: SessionStorage | undefined;

  try {
    storage = getStorage();
    if (storage.getItem(key)) {
      deliveredKeys.add(key);
      return true;
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }

  let gtag: Gtag | undefined;

  try {
    gtag = getGtag();
  } catch {
    return false;
  }

  if (typeof gtag !== "function") {
    return false;
  }

  try {
    gtag("event", eventName, { page_path: pathname });
  } catch {
    return false;
  }

  deliveredKeys.add(key);

  try {
    (storage ?? getStorage()).setItem(key, "1");
  } catch {
    // The in-memory key still prevents duplicate handoffs in this document.
  }

  return true;
}

export function startBoundedRetry<T>(
  attempt: () => boolean,
  scheduler: RetryScheduler<T>,
  {
    delayMs = ANALYTICS_RETRY_DELAY_MS,
    retryLimit = ANALYTICS_RETRY_LIMIT,
  }: RetryOptions = {},
): () => void {
  let stopped = false;
  let retries = 0;
  let timer: T | undefined;

  const run = () => {
    if (stopped || attempt() || retries >= retryLimit) {
      return;
    }

    retries += 1;
    timer = scheduler.setTimeout(run, delayMs);
  };

  run();

  return () => {
    stopped = true;
    if (timer !== undefined) {
      scheduler.clearTimeout(timer);
    }
  };
}
