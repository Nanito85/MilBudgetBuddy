import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
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

interface LastResult {
  action: 'grant' | 'revoke';
  email: string;
  uid?: string;
  proExpiresAt?: string;
}

interface EntitlementRow {
  uid: string;
  email: string | null;
  status?: string;
  proExpiresAt?: string;
  productId?: string;
  platform?: string;
  note?: string;
  verifiedAt?: string;
  accountDeleted?: boolean;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [email, setEmail] = useState('');
  const [durationDays, setDurationDays] = useState('365');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<'grant' | 'revoke' | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [rows, setRows] = useState<EntitlementRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState('');
  const [rowBusyUid, setRowBusyUid] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // AbortSignal.timeout() isn't guaranteed to exist on every Hermes/React
  // Native build — it's the exact thing that caused "undefined is not a
  // function" throughout today's purchase-flow debugging (see
  // src/services/iap.ts). Built manually everywhere in this screen instead.
  const request = async (path: string, options: { method?: string; body?: object } = {}) => {
    const token = await getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
    return data;
  };
  const call = (path: string, body: object) => request(path, { method: 'POST', body });

  // Cursor-paginated (see the backend route's comment for why — an offset
  // wouldn't hold up once this list is in the thousands). fetchRows() always
  // starts a fresh first page; loadMore() appends using the cursor the
  // server handed back from the previous page.
  const fetchRows = async () => {
    setRowsLoading(true); setRowsError('');
    try {
      const data = await request('/api/admin/entitlements?limit=50');
      setRows(data.rows ?? []);
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      setRowsError(e?.message ?? 'Failed to load granted access list');
    } finally {
      setRowsLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const data = await request(`/api/admin/entitlements?limit=50&cursor=${encodeURIComponent(nextCursor)}`);
      setRows((prev) => [...prev, ...(data.rows ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to load more.');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  const handleGrant = async () => {
    const trimmed = email.trim();
    if (!trimmed) { Alert.alert('Error', 'Enter the member’s email.'); return; }
    const dur = parseInt(durationDays, 10);
    if (!Number.isFinite(dur) || dur < 1) { Alert.alert('Error', 'Duration must be at least 1 day.'); return; }

    setBusy('grant');
    try {
      const data = await call('/api/admin/grant-pro', { email: trimmed, durationDays: dur, note: note.trim() || undefined });
      setLastResult({ action: 'grant', email: trimmed, uid: data.uid, proExpiresAt: data.proExpiresAt });
      Alert.alert(
        'Pro Granted',
        `${trimmed} now has Pro until ${new Date(data.proExpiresAt).toLocaleDateString()}.\n\nThey'll see it unlock automatically next time the app syncs — no action needed on their end. If they're using the app right now, a force-close and reopen will pick it up immediately.`,
      );
      setEmail(''); setNote('');
      fetchRows();
    } catch (e: any) {
      Alert.alert('Grant Failed', e?.message ?? 'Could not grant Pro access.');
    } finally {
      setBusy(null);
    }
  };

  const handleRevoke = async () => {
    const trimmed = email.trim();
    if (!trimmed) { Alert.alert('Error', 'Enter the member’s email.'); return; }

    Alert.alert('Revoke Pro', `Remove Pro access from ${trimmed}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive',
        onPress: async () => {
          setBusy('revoke');
          try {
            const data = await call('/api/admin/revoke-pro', { email: trimmed, reason: note.trim() || undefined });
            setLastResult({ action: 'revoke', email: trimmed, uid: data.uid });
            Alert.alert('Pro Revoked', `${trimmed}'s Pro access has been removed.`);
            setEmail(''); setNote('');
            fetchRows();
          } catch (e: any) {
            Alert.alert('Revoke Failed', e?.message ?? 'Could not revoke Pro access.');
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const handleRowRevoke = (row: EntitlementRow) => {
    const label = row.email ?? row.uid;
    Alert.alert('Revoke Pro', `Remove Pro access from ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke', style: 'destructive',
        onPress: async () => {
          setRowBusyUid(row.uid);
          try {
            await call('/api/admin/revoke-pro', { uid: row.uid });
            fetchRows();
          } catch (e: any) {
            Alert.alert('Revoke Failed', e?.message ?? 'Could not revoke Pro access.');
          } finally {
            setRowBusyUid(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]} edges={['top']}>
      <View style={[s.header, { borderColor: tc.borderColor }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <ThemedText style={s.backText}>‹ Admin</ThemedText>
        </Pressable>
        <ThemedText style={[s.headerTitle, { color: tc.textPrimary }]}>👤 GRANT / REVOKE PRO</ThemedText>
        <View style={s.back} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.noticeCard, { backgroundColor: tc.surface, borderColor: Brand.tactical + '40' }]}>
          <ThemedText style={[s.noticeText, { color: tc.textSecondary }]}>
            This grants Pro directly to a member's account server-side — no code, no purchase, nothing they
            need to enter in the app. It writes straight to their profile the same way a real purchase does, so
            it works immediately. (Discount codes on the Codes screen are for record-keeping only right now —
            there's no in-app way for a member to redeem one, so use this screen instead to actually comp someone.)
          </ThemedText>
        </View>

        <View style={[s.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={s.cardTitle}>// MEMBER EMAIL</ThemedText>
          <View style={[s.input, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="friend@example.com"
              placeholderTextColor={tc.textHint}
              style={[s.inputText, { color: tc.textPrimary }]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <ThemedText style={[s.label, { color: tc.textMuted, marginTop: Spacing.two }]}>DURATION (DAYS) — GRANT ONLY</ThemedText>
          <View style={[s.input, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
            <TextInput
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              placeholderTextColor={tc.textHint}
              style={[s.inputText, { color: tc.textPrimary }]}
              maxLength={5}
            />
          </View>
          <ThemedText style={[s.hint, { color: tc.textMuted }]}>
            Extends from their current expiration if they already have time left — never shortens it.
          </ThemedText>

          <ThemedText style={[s.label, { color: tc.textMuted, marginTop: Spacing.two }]}>NOTE (OPTIONAL)</ThemedText>
          <View style={[s.input, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. friend/tester comp"
              placeholderTextColor={tc.textHint}
              style={[s.inputText, { color: tc.textPrimary }]}
            />
          </View>

          <View style={s.btnRow}>
            <Pressable
              onPress={handleGrant}
              disabled={busy !== null}
              style={({ pressed }) => [s.grantBtn, (busy !== null || pressed) && { opacity: 0.6 }]}>
              {busy === 'grant' ? <ActivityIndicator color="#04080F" /> : <ThemedText style={s.grantBtnText}>GRANT PRO</ThemedText>}
            </Pressable>
            <Pressable
              onPress={handleRevoke}
              disabled={busy !== null}
              style={({ pressed }) => [s.revokeBtn, { borderColor: Brand.classified + '60' }, (busy !== null || pressed) && { opacity: 0.6 }]}>
              {busy === 'revoke' ? <ActivityIndicator color={Brand.classified} /> : <ThemedText style={[s.revokeBtnText, { color: Brand.classified }]}>REVOKE</ThemedText>}
            </Pressable>
          </View>
        </View>

        {lastResult && (
          <View style={[s.card, { backgroundColor: tc.surface, borderColor: Brand.tactical + '40' }]}>
            <ThemedText style={s.cardTitle}>// LAST ACTION</ThemedText>
            <ThemedText style={[s.resultText, { color: tc.textPrimary }]}>
              {lastResult.action === 'grant' ? 'Granted' : 'Revoked'} — {lastResult.email}
            </ThemedText>
            {lastResult.uid && (
              <ThemedText style={[s.resultSub, { color: tc.textMuted }]}>uid: {lastResult.uid}</ThemedText>
            )}
            {lastResult.proExpiresAt && (
              <ThemedText style={[s.resultSub, { color: tc.textMuted }]}>
                Pro until {new Date(lastResult.proExpiresAt).toLocaleString()}
              </ThemedText>
            )}
          </View>
        )}

        <View style={s.listHeaderRow}>
          <ThemedText style={s.sectionTitle}>// GRANTED / PRO ACCESS ({rows.length})</ThemedText>
          <Pressable onPress={fetchRows}>
            <ThemedText style={[s.refreshText, { color: Brand.accent }]}>REFRESH</ThemedText>
          </Pressable>
        </View>

        {rowsLoading && <ActivityIndicator color={Brand.accent} style={{ marginTop: Spacing.two }} />}
        {!!rowsError && <ThemedText style={[s.errorText, { color: Brand.classified }]}>{rowsError}</ThemedText>}
        {!rowsLoading && !rowsError && rows.length === 0 && (
          <ThemedText style={[s.emptyText, { color: tc.textMuted }]}>No entitlement records yet.</ThemedText>
        )}

        {rows.map((row) => {
          const expired = row.proExpiresAt ? new Date(row.proExpiresAt) < new Date() : true;
          const active = row.status === 'pro' && !expired && !row.accountDeleted;
          const statusColor = row.accountDeleted ? Brand.classified : active ? Brand.tactical : '#6B7280';
          return (
            <View key={row.uid} style={[s.rowCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <View style={s.rowTop}>
                <ThemedText
                  style={[s.rowEmail, { color: row.accountDeleted ? tc.textMuted : tc.textPrimary }]}
                  numberOfLines={1}>
                  {row.email ?? row.uid}
                </ThemedText>
                <View style={[s.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
                  <ThemedText style={[s.statusText, { color: statusColor }]}>
                    {row.accountDeleted ? 'ACCOUNT DELETED' : active ? 'ACTIVE' : expired ? 'EXPIRED' : 'FREE'}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={[s.rowMeta, { color: tc.textSecondary }]}>
                {row.productId ?? 'unknown'} · {row.platform ?? 'unknown'}
                {row.proExpiresAt ? ` · exp ${new Date(row.proExpiresAt).toLocaleDateString()}` : ''}
              </ThemedText>
              {!!row.note && <ThemedText style={[s.rowMeta, { color: tc.textMuted }]}>note: {row.note}</ThemedText>}
              {row.accountDeleted && (
                <ThemedText style={[s.rowMeta, { color: tc.textMuted, fontStyle: 'italic' }]}>
                  This entitlement record is orphaned — the member's account no longer exists. Kept for history; nothing to revoke.
                </ThemedText>
              )}
              {active && (
                <Pressable
                  onPress={() => handleRowRevoke(row)}
                  disabled={rowBusyUid !== null}
                  style={[s.rowRevokeBtn, { borderColor: Brand.classified + '50' }, rowBusyUid === row.uid && { opacity: 0.6 }]}>
                  {rowBusyUid === row.uid
                    ? <ActivityIndicator color={Brand.classified} size="small" />
                    : <ThemedText style={[s.rowRevokeText, { color: Brand.classified }]}>REVOKE</ThemedText>}
                </Pressable>
              )}
            </View>
          );
        })}

        {nextCursor && (
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
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 60 },

  noticeCard: { borderWidth: 1, borderRadius: 10, padding: Spacing.three },
  noticeText: { fontSize: 12, lineHeight: 18 },

  card: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, gap: Spacing.one },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 1, marginBottom: 4 },

  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  hint: { fontSize: 10, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2 },
  inputText: { fontSize: 15, fontWeight: '600' },

  btnRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  grantBtn: { flex: 2, backgroundColor: Brand.accent, borderRadius: 6, padding: Spacing.two + 2, alignItems: 'center' },
  grantBtnText: { color: '#04080F', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  revokeBtn: { flex: 1, borderWidth: 1, borderRadius: 6, padding: Spacing.two + 2, alignItems: 'center' },
  revokeBtnText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  resultText: { fontSize: 13, fontWeight: '700' },
  resultSub: { fontSize: 11, marginTop: 2, fontFamily: 'monospace' },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  refreshText: { fontSize: 11, fontWeight: '700' },
  errorText: { fontSize: 12, textAlign: 'center', marginTop: Spacing.two },
  emptyText: { fontSize: 12, textAlign: 'center', paddingVertical: Spacing.three },

  rowCard: { borderWidth: 1, borderRadius: 8, padding: Spacing.two + 2, gap: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  rowEmail: { fontSize: 13, fontWeight: '700', flex: 1 },
  statusPill: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  rowMeta: { fontSize: 10 },
  rowRevokeBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 4, marginTop: 4 },
  rowRevokeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  loadMoreBtn: { borderWidth: 1, borderRadius: 6, padding: Spacing.two, alignItems: 'center', marginTop: Spacing.one },
  loadMoreText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
