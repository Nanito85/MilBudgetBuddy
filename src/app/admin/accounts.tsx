import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  try { return await auth.currentUser?.getIdToken() ?? null; } catch { return null; }
}

interface AccountRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt?: string;
  lastSignIn?: string;
  disabled: boolean;
  lastKnownPlatform: string | null;
}

async function request(path: string) {
  const token = await getToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
  return data;
}

function platformLabel(p: string | null): string {
  if (p === 'android') return 'Android';
  if (p === 'ios') return 'iOS';
  return 'Unknown';
}

export default function AdminAccountsScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalSeen, setTotalSeen] = useState(0);

  const fetchFirstPage = async () => {
    setLoading(true); setError('');
    try {
      const data = await request('/api/admin/users?limit=50');
      setRows(data.rows ?? []);
      setNextPageToken(data.nextPageToken ?? null);
      setTotalSeen(data.rows?.length ?? 0);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextPageToken) return;
    setLoadingMore(true);
    try {
      const data = await request(`/api/admin/users?limit=50&pageToken=${encodeURIComponent(nextPageToken)}`);
      setRows((prev) => [...prev, ...(data.rows ?? [])]);
      setNextPageToken(data.nextPageToken ?? null);
      setTotalSeen((prev) => prev + (data.rows?.length ?? 0));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load more.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchFirstPage(); }, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]} edges={['top']}>
      <View style={[s.header, { borderColor: tc.borderColor }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <ThemedText style={s.backText}>‹ Admin</ThemedText>
        </Pressable>
        <ThemedText style={[s.headerTitle, { color: tc.textPrimary }]}>📋 ALL ACCOUNTS</ThemedText>
        <Pressable onPress={fetchFirstPage} style={s.back}>
          <ThemedText style={[s.refreshText, { color: Brand.accent }]}>REFRESH</ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.noticeCard, { backgroundColor: tc.surface, borderColor: Brand.tactical + '40' }]}>
          <ThemedText style={[s.noticeText, { color: tc.textSecondary }]}>
            Every account that's ever signed up, Android or iOS — Firebase accounts aren't tied to which store they
            were created through, so this is one combined list, not two separate ones. PLATFORM updates every time a
            signed-in member opens the app (as of 2026-08-21) — a row still showing "Unknown" means that member
            hasn't reopened the app since then, not that platform tracking is broken.
          </ThemedText>
        </View>

        {loading && <ActivityIndicator color={Brand.accent} style={{ marginTop: Spacing.two }} />}
        {!!error && <ThemedText style={[s.errorText, { color: Brand.classified }]}>{error}</ThemedText>}
        {!loading && !error && rows.length === 0 && (
          <ThemedText style={[s.emptyText, { color: tc.textMuted }]}>No accounts found.</ThemedText>
        )}

        {!loading && !error && rows.length > 0 && (
          <ThemedText style={[s.countText, { color: tc.textMuted }]}>Showing {totalSeen} account{totalSeen === 1 ? '' : 's'}</ThemedText>
        )}

        {rows.map((row) => (
          <View key={row.uid} style={[s.rowCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <View style={s.rowTop}>
              <ThemedText style={[s.rowEmail, { color: tc.textPrimary }]} numberOfLines={1}>
                {row.email ?? row.displayName ?? row.uid}
              </ThemedText>
              {row.disabled && (
                <View style={[s.statusPill, { backgroundColor: Brand.classified + '20', borderColor: Brand.classified + '50' }]}>
                  <ThemedText style={[s.statusText, { color: Brand.classified }]}>DISABLED</ThemedText>
                </View>
              )}
              <View style={[s.statusPill, { backgroundColor: Brand.tactical + '20', borderColor: Brand.tactical + '50' }]}>
                <ThemedText style={[s.statusText, { color: Brand.tactical }]}>{platformLabel(row.lastKnownPlatform)}</ThemedText>
              </View>
            </View>
            <ThemedText style={[s.rowMeta, { color: tc.textSecondary }]}>
              Joined {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'unknown'}
              {row.lastSignIn ? ` · last seen ${new Date(row.lastSignIn).toLocaleDateString()}` : ''}
            </ThemedText>
          </View>
        ))}

        {nextPageToken && (
          <Pressable
            onPress={loadMore}
            disabled={loadingMore}
            style={[s.loadMoreBtn, { borderColor: tc.borderColor }, loadingMore && { opacity: 0.6 }]}>
            {loadingMore
              ? <ActivityIndicator color={Brand.accent} size="small" />
              : <ThemedText style={[s.loadMoreText, { color: Brand.accent }]}>LOAD MORE</ThemedText>}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { minWidth: 60 },
  backText: { color: Brand.tactical, fontSize: 14, fontWeight: '700' },
  refreshText: { fontSize: 11, fontWeight: '700', textAlign: 'right' },
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: 60 },

  noticeCard: { borderWidth: 1, borderRadius: 10, padding: Spacing.three },
  noticeText: { fontSize: 12, lineHeight: 18 },

  errorText: { fontSize: 12, textAlign: 'center', marginTop: Spacing.two },
  emptyText: { fontSize: 12, textAlign: 'center', paddingVertical: Spacing.three },
  countText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  rowCard: { borderWidth: 1, borderRadius: 8, padding: Spacing.two + 2, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  rowEmail: { fontSize: 13, fontWeight: '700', flex: 1 },
  statusPill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  rowMeta: { fontSize: 10 },

  loadMoreBtn: { borderWidth: 1, borderRadius: 6, padding: Spacing.two, alignItems: 'center', marginTop: Spacing.one },
  loadMoreText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
