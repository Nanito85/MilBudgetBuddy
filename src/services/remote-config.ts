import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const CACHE_KEY = 'mbb_remote_config_v1';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export interface RemoteConfig {
  rateVersions: {
    bah: string;
    basicPay: string;
    perDiem: string;
  };
  featureFlags: {
    lesDecoderEnabled: boolean;
    travelEnabled: boolean;
    reservesHubEnabled: boolean;
  };
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    expiresAt?: string;
  }>;
  minAppVersion: string;
  forceUpdateVersion: string | null;
  // Route prefixes (e.g. '/pcs-calculator') switched off remotely — the
  // fallback when a tool is showing wrong numbers and an OTA fix isn't out
  // yet. Set with the admin /set-flag endpoint, key "disabledRoutes".
  disabledRoutes: string[];
}

// Hardcoded fallback — used when server is unreachable
const FALLBACK_CONFIG: RemoteConfig = {
  rateVersions: { bah: '2026.1', basicPay: '2026.1', perDiem: '2026.1' },
  featureFlags: {
    lesDecoderEnabled: true,
    travelEnabled: true,
    reservesHubEnabled: true,
  },
  announcements: [],
  minAppVersion: '1.0.0',
  forceUpdateVersion: null,
  disabledRoutes: [],
};

// Reactive copy so components (RemoteNotices) update when a fetch lands.
export const useRemoteConfig = create<{ config: RemoteConfig }>(() => ({ config: FALLBACK_CONFIG }));

function setConfig(config: RemoteConfig) {
  useRemoteConfig.setState({ config });
}

export function getRemoteConfig(): RemoteConfig {
  return useRemoteConfig.getState().config;
}

/** -1 / 0 / 1 comparing dotted numeric versions ("1.0.3" vs "1.1"). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export async function initRemoteConfig(): Promise<void> {
  // Load cached config immediately so the app doesn't wait on network
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const { config, fetchedAt } = JSON.parse(raw);
      setConfig(sanitizeConfig(config));
      if (Date.now() - fetchedAt < CACHE_TTL_MS) return; // still fresh
    }
  } catch {
    // Cache miss or parse error — fall through to fetch
  }

  await fetchRemoteConfig();
}

// Merge only known safe keys from the server — prevents injection of arbitrary fields
function sanitizeConfig(raw: unknown): RemoteConfig {
  if (!raw || typeof raw !== 'object') return FALLBACK_CONFIG;
  const r = raw as Record<string, unknown>;

  const flags = (r.featureFlags && typeof r.featureFlags === 'object')
    ? r.featureFlags as Record<string, unknown>
    : {};
  const rates = (r.rateVersions && typeof r.rateVersions === 'object')
    ? r.rateVersions as Record<string, unknown>
    : {};

  return {
    rateVersions: {
      bah:      typeof rates.bah === 'string'      ? rates.bah      : FALLBACK_CONFIG.rateVersions.bah,
      basicPay: typeof rates.basicPay === 'string' ? rates.basicPay : FALLBACK_CONFIG.rateVersions.basicPay,
      perDiem:  typeof rates.perDiem === 'string'  ? rates.perDiem  : FALLBACK_CONFIG.rateVersions.perDiem,
    },
    featureFlags: {
      lesDecoderEnabled:       typeof flags.lesDecoderEnabled === 'boolean'      ? flags.lesDecoderEnabled       : FALLBACK_CONFIG.featureFlags.lesDecoderEnabled,
      travelEnabled:           typeof flags.travelEnabled === 'boolean'          ? flags.travelEnabled           : FALLBACK_CONFIG.featureFlags.travelEnabled,
      reservesHubEnabled:      typeof flags.reservesHubEnabled === 'boolean'     ? flags.reservesHubEnabled      : FALLBACK_CONFIG.featureFlags.reservesHubEnabled,
    },
    announcements: Array.isArray(r.announcements)
      ? (r.announcements as any[])
          .filter((a) => a && typeof a.id === 'string' && typeof a.title === 'string' && typeof a.body === 'string')
          .slice(0, 10) // cap at 10 announcements
          .map((a) => ({ id: String(a.id).slice(0, 64), title: String(a.title).slice(0, 120), body: String(a.body).slice(0, 500), expiresAt: typeof a.expiresAt === 'string' ? a.expiresAt : undefined }))
      : [],
    minAppVersion:     typeof r.minAppVersion === 'string'     ? r.minAppVersion     : FALLBACK_CONFIG.minAppVersion,
    forceUpdateVersion: typeof r.forceUpdateVersion === 'string' ? r.forceUpdateVersion : null,
    // Server sends it inside featureFlags; the cached copy has it top-level.
    disabledRoutes: ((Array.isArray(flags.disabledRoutes) ? flags.disabledRoutes : Array.isArray(r.disabledRoutes) ? r.disabledRoutes : []) as unknown[])
      .filter((x): x is string => typeof x === 'string' && x.startsWith('/'))
      .slice(0, 50),
  };
}

export async function fetchRemoteConfig(): Promise<void> {
  try {
    // AbortSignal.timeout() isn't guaranteed to exist on every Hermes/React
    // Native build — built manually so it can't be a silent source of
    // "undefined is not a function" here either (see src/services/iap.ts
    // for the same fix on the purchase-verification path).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/api/config`, {
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (!res.ok) return;
    const raw = await res.json();
    const data = sanitizeConfig(raw);
    setConfig(data);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ config: data, fetchedAt: Date.now() }));
  } catch {
    // Network unavailable — keep using cached or fallback config, silent fail
  }
}
