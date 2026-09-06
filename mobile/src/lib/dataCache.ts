import AsyncStorage from '@react-native-async-storage/async-storage';

// Stale-while-revalidate cache for the per-user API documents (profile, leki,
// pomiary, INR). Screens render the cached copy immediately on mount, then
// refresh from the network in the background — so a cold Cloud Run start
// delays the *update*, not the first paint.
//
// A memory layer sits in front of AsyncStorage: `hydrateCache` warms it while
// the native splash screen is still up (AuthContext), so screens can read
// synchronously in their useState initializers and skip the skeleton frame
// entirely. AsyncStorage reads are async (bridge + disk) and land a few
// frames too late on a busy launch JS thread — hence the memory copy.
//
// Keys are scoped by uid: a guest caches the owner's data under their own uid,
// and two accounts on one device never see each other's entries. Everything
// under the version prefix is wiped on sign-out (see AuthContext).

const PREFIX = 'cache.v1';

// Documents hydrated at startup. Screens must use these exact resource names.
export const CACHED_RESOURCES = ['patient-profile', 'medications', 'inr', 'measurements', 'documents'];

const memCache = new Map<string, unknown>();

const memKey = (uid: string, resource: string) => `${uid}.${resource}`;
const cacheKey = (uid: string, resource: string) => `${PREFIX}.${uid}.${resource}`;

export async function readCache<T>(uid: string, resource: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(uid, resource));
    return raw != null ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

// Memory-only read for first-render useState initializers. Returns null until
// `hydrateCache` has run (or a writeCache filled the entry this session).
export function readCacheSync<T>(uid: string, resource: string): T | null {
  return (memCache.get(memKey(uid, resource)) as T | undefined) ?? null;
}

// Warm the memory layer from disk. Called while the splash screen is visible,
// before any data screen mounts.
export async function hydrateCache(uid: string, resources: string[] = CACHED_RESOURCES): Promise<void> {
  await Promise.all(
    resources.map(async (resource) => {
      const value = await readCache(uid, resource);
      if (value != null) memCache.set(memKey(uid, resource), value);
    }),
  );
}

// Fire-and-forget: cache writes must never block or fail a save/load path.
export function writeCache(uid: string, resource: string, value: unknown): void {
  memCache.set(memKey(uid, resource), value);
  AsyncStorage.setItem(cacheKey(uid, resource), JSON.stringify(value)).catch(() => {});
}

export async function clearAllCaches(): Promise<void> {
  memCache.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(`${PREFIX}.`));
    if (mine.length > 0) await AsyncStorage.multiRemove(mine);
  } catch {
    // best effort
  }
}
