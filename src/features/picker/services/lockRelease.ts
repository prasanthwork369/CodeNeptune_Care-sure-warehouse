// Prune settled entries once no in-flight request could still predate them
const SETTLED_TTL_MS = 60_000;

/**
 * Tracks lock releases so an active-locks response that may predate a release
 * doesn't bring the released lock back. Without this, going back from Order
 * Details refetches locks (Picker regains focus) while the release request is
 * still in flight; the server still reports the lock, the order is hidden from
 * New Orders, and the next order briefly jumps to the top until the release
 * lands and locks are refetched again.
 */
export const createReleaseTracker = (now: () => number = Date.now) => {
  // orderId -> time the release succeeded, or null while it is in flight
  const releases = new Map<string, number | null>();

  return {
    start: (orderId: string) => {
      releases.set(orderId, null);
    },
    succeed: (orderId: string) => {
      if (releases.has(orderId)) releases.set(orderId, now());
    },
    // Release failed, or the order was claimed again: its lock is real
    clear: (orderId: string) => {
      releases.delete(orderId);
    },
    /** Drops locks whose release was in flight or landed after `requestedAt`. */
    filter: <T extends { orderId: string }>(
      locks: T[],
      requestedAt: number,
    ): T[] => {
      const current = now();
      releases.forEach((settledAt, orderId) => {
        if (settledAt !== null && current - settledAt > SETTLED_TTL_MS)
          releases.delete(orderId);
      });
      return locks.filter((lock) => {
        const settledAt = releases.get(lock.orderId);
        if (settledAt === undefined) return true;
        return settledAt !== null && requestedAt >= settledAt;
      });
    },
  };
};

export const releaseTracker = createReleaseTracker();
