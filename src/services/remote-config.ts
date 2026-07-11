import AsyncStorage from '@react-native-async-storage/async-storage';

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
    freeBudgetCategoryLimit: number;
    freeKidsLimit: number;
    iapEnabled: boolean;
    lesDecoderEnabled: boolean;
    travelEnabled: boolean;
    reservesHubEnabled: boolean;
    claudeAssistantEnabled: boolean;
    freeToolIds: string[];
  };
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    expiresAt?: string;
  }>;
  minAppVersion: string;
  forceUpdateVersion: string | null;
}

// Hardcoded fallback — used when server is unreachable
const FALLBACK_CONFIG: RemoteConfig = {
  rateVersions: { bah: '2026.1', basicPay: '2026.1', perDiem: '2026.1' },
  featureFlags: {
    freeBudgetCategoryLimit: 3,
    freeKidsLimit: 1,
    iapEnabled: false,
    lesDecoderEnabled: true,
    travelEnabled: true,
    reservesHubEnabled: true,
    claudeAssistantEnabled: true,
    freeToolIds: ['pay_chart', 'bah_guide', 'les', 'pcs'],
  },
  announcements: [],
  minAppVersion: '1.0.0',
  forceUpdateVersion: null,
};

let _config: RemoteConfig = FALLBACK_CONFIG;

export function getRemoteConfig(): RemoteConfig {
  return _config;
}

export async function initRemoteConfig(): Promise<void> {
  // Load cached config immediately so the app doesn't wait on network
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const { config, fetchedAt } = JSON.parse(raw);
      _config = { ...FALLBACK_CONFIG, ...config };
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
      freeBudgetCategoryLimit: typeof flags.freeBudgetCategoryLimit === 'number' ? flags.freeBudgetCategoryLimit : FALLBACK_CONFIG.featureFlags.freeBudgetCategoryLimit,
      freeKidsLimit:           typeof flags.freeKidsLimit === 'number'           ? flags.freeKidsLimit           : FALLBACK_CONFIG.featureFlags.freeKidsLimit,
      iapEnabled:              typeof flags.iapEnabled === 'boolean'             ? flags.iapEnabled              : FALLBACK_CONFIG.featureFlags.iapEnabled,
      lesDecoderEnabled:       typeof flags.lesDecoderEnabled === 'boolean'      ? flags.lesDecoderEnabled       : FALLBACK_CONFIG.featureFlags.lesDecoderEnabled,
      travelEnabled:           typeof flags.travelEnabled === 'boolean'          ? flags.travelEnabled           : FALLBACK_CONFIG.featureFlags.travelEnabled,
      reservesHubEnabled:      typeof flags.reservesHubEnabled === 'boolean'     ? flags.reservesHubEnabled      : FALLBACK_CONFIG.featureFlags.reservesHubEnabled,
      claudeAssistantEnabled:  typeof flags.claudeAssistantEnabled === 'boolean' ? flags.claudeAssistantEnabled  : FALLBACK_CONFIG.featureFlags.claudeAssistantEnabled,
      freeToolIds:             Array.isArray(flags.freeToolIds) && flags.freeToolIds.every((x) => typeof x === 'string')
                                 ? flags.freeToolIds as string[]
                                 : FALLBACK_CONFIG.featureFlags.freeToolIds,
    },
    announcements: Array.isArray(r.announcements)
      ? (r.announcements as any[])
          .filter((a) => a && typeof a.id === 'string' && typeof a.title === 'string' && typeof a.body === 'string')
          .slice(0, 10) // cap at 10 announcements
          .map((a) => ({ id: String(a.id).slice(0, 64), title: String(a.title).slice(0, 120), body: String(a.body).slice(0, 500), expiresAt: typeof a.expiresAt === 'string' ? a.expiresAt : undefined }))
      : [],
    minAppVersion:     typeof r.minAppVersion === 'string'     ? r.minAppVersion     : FALLBACK_CONFIG.minAppVersion,
    forceUpdateVersion: typeof r.forceUpdateVersion === 'string' ? r.forceUpdateVersion : null,
  };
}

export async function fetchRemoteConfig(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/config`, {
      headers: { 'content-type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;
    const raw = await res.json();
    const data = sanitizeConfig(raw);
    _config = data;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ config: data, fetchedAt: Date.now() }));
  } catch {
    // Network unavailable — keep using cached or fallback config, silent fail
  }
}
