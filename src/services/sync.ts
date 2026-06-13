import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import dayjs from 'dayjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { CloudPayload, DEFAULT_PROFILE, useFitStore } from '../store/useFitStore';
import { DayLog } from '../types';
import { DEFAULT_EXERCISE_PLAN } from '../data/exercisePlan';

const QUEUE_KEY = 'fitmate-sync-queue';
const DEBOUNCE_MS = 2000;
const HYDRATE_DAYS = 90;

// Dirty keys: 'user' (profile/plans/weightHistory) or 'log:YYYY-MM-DD'.
let dirty = new Set<string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let unsubscribeNet: (() => void) | null = null;
let appStateSub: { remove: () => void } | null = null;
let flushing = false;
let started = false;
// Incremented by stopSync() — any in-flight fetchLogsInBackground with an
// older generation is stale and must not write to the store.
let syncGeneration = 0;

async function loadQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) dirty = new Set(JSON.parse(raw));
  } catch {
    // corrupted queue — start fresh
  }
}

async function saveQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...dirty]));
  } catch {
    // best effort
  }
}

function markDirty(keys: string[]) {
  keys.forEach((k) => dirty.add(k));
  void saveQueue();
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void flush(), DEBOUNCE_MS);
}

export async function flush(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid || flushing || dirty.size === 0) return;
  flushing = true;
  const keys = [...dirty];
  try {
    const state = useFitStore.getState();
    const batch = writeBatch(db);
    for (const key of keys) {
      if (key === 'user') {
        batch.set(
          doc(db, 'users', uid),
          {
            profile: state.profile,
            mealPlan: state.mealPlan,
            exercisePlan: state.exercisePlan,
            weightHistory: state.weightHistory,
            schemaVersion: 2,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else if (key.startsWith('log:')) {
        const date = key.slice(4);
        const log = state.logs[date];
        if (log) {
          batch.set(doc(db, 'users', uid, 'logs', date), {
            ...log,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
    await batch.commit();
    keys.forEach((k) => dirty.delete(k));
    await saveQueue();
  } catch (err) {
    // Stay dirty; retried on next trigger (reconnect/foreground/change).
    console.warn('Sync flush failed:', err);
  } finally {
    flushing = false;
  }
}

/**
 * Fetches only the user profile doc (fast). Returns null for brand-new accounts.
 */
async function fetchUserDoc(uid: string): Promise<Omit<CloudPayload, 'logs'> | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;
  const data = userSnap.data();
  return {
    profile: data.profile ?? DEFAULT_PROFILE,
    mealPlan: data.mealPlan ?? [],
    exercisePlan: data.exercisePlan ?? DEFAULT_EXERCISE_PLAN,
    weightHistory: data.weightHistory ?? [],
  };
}

/**
 * Fetches logs subcollection in the background after UI is already shown.
 * `generation` must match syncGeneration at write time — if stopSync() was
 * called while this was in-flight, the generation will have advanced and the
 * stale results are discarded instead of overwriting a reset/sign-out state.
 */
async function fetchLogsInBackground(uid: string, generation: number) {
  try {
    const logs: Record<string, DayLog> = {};
    const cutoff = dayjs().subtract(HYDRATE_DAYS, 'day').format('YYYY-MM-DD');
    const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
    logsSnap.forEach((d) => {
      if (d.id >= cutoff) {
        const { updatedAt: _ignored, ...log } = d.data() as DayLog & { updatedAt?: unknown };
        logs[d.id] = log as DayLog;
      }
    });
    // Abort if stopSync() was called while we were fetching.
    if (generation !== syncGeneration) return;
    // Cloud is the base. Dirty local logs (edits made while fetch was in-flight)
    // override cloud. Non-dirty local logs do NOT override — cloud is authoritative.
    useFitStore.setState((s) => {
      const merged: Record<string, DayLog> = { ...logs };
      for (const date of Object.keys(s.logs)) {
        if (dirty.has(`log:${date}`)) merged[date] = s.logs[date];
      }
      return { logs: merged };
    });
  } catch (err) {
    console.warn('Background log fetch failed:', err);
  }
}

/**
 * Fetches the user's cloud snapshot. Returns null when the user doc
 * doesn't exist (brand-new account).
 */
export async function fetchCloud(uid: string): Promise<CloudPayload | null> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return null;

  const data = userSnap.data();
  const logs: Record<string, DayLog> = {};
  const cutoff = dayjs().subtract(HYDRATE_DAYS, 'day').format('YYYY-MM-DD');
  const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
  logsSnap.forEach((d) => {
    if (d.id >= cutoff) {
      const { updatedAt: _ignored, ...log } = d.data() as DayLog & { updatedAt?: unknown };
      logs[d.id] = log as DayLog;
    }
  });

  return {
    profile: data.profile ?? DEFAULT_PROFILE,
    mealPlan: data.mealPlan ?? [],
    exercisePlan: data.exercisePlan ?? DEFAULT_EXERCISE_PLAN,
    weightHistory: data.weightHistory ?? [],
    logs,
  };
}

/** Pushes the entire local state to the cloud (first sync of a local-only user). */
export async function pushAll(uid: string): Promise<void> {
  const state = useFitStore.getState();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    profile: state.profile,
    mealPlan: state.mealPlan,
    exercisePlan: state.exercisePlan,
    weightHistory: state.weightHistory,
    schemaVersion: 2,
    updatedAt: serverTimestamp(),
  });
  const dates = Object.keys(state.logs);
  for (let i = 0; i < dates.length; i += 400) {
    // writeBatch caps at 500 ops; chunk conservatively (first chunk shares
    // the batch with the user doc).
    const chunkBatch = i === 0 ? batch : writeBatch(db);
    for (const date of dates.slice(i, i + 400)) {
      chunkBatch.set(doc(db, 'users', uid, 'logs', date), {
        ...state.logs[date],
        updatedAt: serverTimestamp(),
      });
    }
    await chunkBatch.commit();
  }
  if (dates.length === 0) await batch.commit();
}

/**
 * Hydrates local state from the cloud, then starts the write-through engine.
 * MUST be called once after sign-in, before the user can edit data.
 *
 * Returns 'onboarding' when neither cloud nor local has an onboarded profile.
 */
export async function startSync(): Promise<'ready' | 'onboarding'> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('startSync called without a signed-in user');
  if (started) stopSync();
  started = true;

  // Capture generation AFTER stopSync() (which increments it) so the
  // background fetch below is tied to this sync session.
  const gen = syncGeneration;

  await loadQueue();
  const hadOfflineEdits = dirty.size > 0;

  let result: 'ready' | 'onboarding' = 'ready';
  try {
    // Fast path: fetch only the user doc (no logs) so UI unblocks quickly.
    const cloud = await fetchUserDoc(uid);
    const local = useFitStore.getState();

    if (cloud && cloud.profile?.onboarded) {
      if (hadOfflineEdits && dirty.has('user')) {
        // Keep local user doc (newer), take cloud for everything else.
        useFitStore.setState({
          mealPlan: local.mealPlan,
          exercisePlan: local.exercisePlan,
          weightHistory: local.weightHistory,
          profile: local.profile,
        });
      } else {
        useFitStore.setState({
          profile: cloud.profile,
          mealPlan: cloud.mealPlan,
          exercisePlan: cloud.exercisePlan,
          weightHistory: cloud.weightHistory,
        });
      }
      // Fetch logs in background — UI is already showing.
      void fetchLogsInBackground(uid, gen);
    } else if (local.profile.onboarded) {
      // Existing local user, first cloud sync — push everything up.
      await pushAll(uid);
    } else {
      result = 'onboarding';
    }
  } catch (err) {
    console.warn('Cloud hydration failed (continuing local-first):', err);
    if (!useFitStore.getState().profile.onboarded) result = 'onboarding';
  }

  // Subscribe AFTER hydration so we never push pre-hydration state.
  let prev = useFitStore.getState();
  unsubscribeStore = useFitStore.subscribe((state) => {
    const keys: string[] = [];
    if (
      state.profile !== prev.profile ||
      state.mealPlan !== prev.mealPlan ||
      state.exercisePlan !== prev.exercisePlan ||
      state.weightHistory !== prev.weightHistory
    ) {
      keys.push('user');
    }
    if (state.logs !== prev.logs) {
      for (const date of Object.keys(state.logs)) {
        if (state.logs[date] !== prev.logs[date]) keys.push(`log:${date}`);
      }
    }
    prev = state;
    if (keys.length) markDirty(keys);
  });

  unsubscribeNet = NetInfo.addEventListener((netState) => {
    if (netState.isConnected) void flush();
  });

  appStateSub = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (status === 'active') void flush();
  });

  if (hadOfflineEdits) void flush();

  return result;
}

export function stopSync() {
  syncGeneration++; // invalidate any in-flight fetchLogsInBackground
  unsubscribeStore?.();
  unsubscribeStore = null;
  unsubscribeNet?.();
  unsubscribeNet = null;
  appStateSub?.remove();
  appStateSub = null;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  started = false;
}

/** Deletes every cloud doc for the user. Used by reset and account deletion. */
export async function deleteCloudData(uid: string): Promise<void> {
  const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
  const docs = logsSnap.docs;
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', uid));
  await batch.commit();
  dirty.clear();
  await saveQueue();
}
