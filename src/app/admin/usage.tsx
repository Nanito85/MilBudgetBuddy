import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { auth } from '@/services/firebase';
import { labelForRoute } from '@/data/tool-labels';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const WINDOWS = [
  { label: '7D',  days: 7 },
  { label: '30D', days: 30 },
];

interface ToolUsageRow {
  screen: string;
  count: number;
  pct: number;
}

async function getToken(): Promise<string | null> {
  try { return await auth.currentUser?.getIdToken() ?? null; } catch { return null; }
}

// ── Usage Row ────────────────────────────────────────────────────────────────

function UsageRow({ item, maxCount, rank }: { item: ToolUsageRow; maxCount: number; rank: number }) {
  const tc = useThemeColors();
  const { title, icon } = labelForRoute(item.screen);
  const barPct = maxCount > 0 ? Math.max((item.count / maxCount) * 100, 3) : 0;
  const barColor = rank === 0 ? Brand.accent : rank < 3 ? Brand.tactical : tc.textHint;

  return (
    <View style={s.row}>
      <ThemedText style={[s.rank, { color: tc.textMuted }]}>{rank + 1}</ThemedText>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.rowTop}>
          <ThemedText style={[s.rowTitle, { color: tc.textPrimary }]} numberOfLines={1}>
            {icon} {title}
          </ThemedText>
          <ThemedText style={[s.rowCount, { color: barColor }]}>
            {item.count.toLocaleString()} <ThemedText style={[s.rowPct, { color: tc.textMuted }]}>({(item.pct * 100).toFixed(1)}%)</ThemedText>
          </ThemedText>
        </View>
        <View style={[s.track, { backgroundColor: tc.surfaceInner }]}>
          <View style={[s.fill, { width: `${barPct}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function AdminUsageScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [days, setDays] = useState(7);
  const [tools, setTools] = useState<ToolUsageRow[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsage = async (windowDays: number) => {
    setLoading(true); setError('');
    const token = await getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/tool-usage?days=${windowDays}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const body = await res.json();
      setTools(body.tools ?? []);
      setTotalViews(body.totalViews ?? 0);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsage(days); }, [days]);

  const maxCount = tools.length > 0 ? tools[0].count : 0;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: tc.background }]} edges={['top']}>
      <View style={[s.header, { borderColor: tc.borderColor }]}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <ThemedText style={s.backText}>‹ Admin</ThemedText>
        </Pressable>
        <ThemedText style={[s.headerTitle, { color: tc.textPrimary }]}>📊 TOOL USAGE</ThemedText>
        <Pressable onPress={() => fetchUsage(days)} style={s.back}>
          <ThemedText style={s.refreshText}>REFRESH</ThemedText>
        </Pressable>
      </View>

      <View style={s.windowRow}>
        {WINDOWS.map((w) => (
          <Pressable
            key={w.days}
            onPress={() => setDays(w.days)}
            style={[
              s.windowBtn,
              { borderColor: tc.borderColor },
              days === w.days && { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '15' },
            ]}>
            <ThemedText style={[s.windowBtnText, { color: days === w.days ? Brand.tactical : tc.textSecondary }]}>
              {w.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={[s.hint, { color: tc.textMuted }]}>
        Ranked by screen views over the last {days} day{days !== 1 ? 's' : ''} — {totalViews.toLocaleString()} total view{totalViews !== 1 ? 's' : ''}
        across all users. Every navigation the app makes counts as one view; the tool at the top is what people reach for most.
      </ThemedText>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {loading && <ActivityIndicator color={Brand.accent} style={{ marginTop: Spacing.four }} />}
        {!!error && !loading && <ThemedText style={s.errorText}>{error}</ThemedText>}

        {!loading && !error && tools.length === 0 && (
          <ThemedText style={[s.emptyText, { color: tc.textMuted }]}>
            No screen views recorded in this window yet.
          </ThemedText>
        )}

        {!loading && !error && tools.map((item, i) => (
          <UsageRow key={item.screen} item={item} maxCount={maxCount} rank={i} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { minWidth: 60 },
  backText: { color: Brand.tactical, fontSize: 14, fontWeight: '700' },
  refreshText: { color: Brand.accent, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  headerTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  windowRow: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  windowBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  windowBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  hint: { fontSize: 11, lineHeight: 16, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.one },

  content: { padding: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two + 2, paddingBottom: 60 },
  errorText: { color: Brand.classified, fontSize: 12, textAlign: 'center', marginTop: Spacing.three },
  emptyText: { fontSize: 12, textAlign: 'center', paddingVertical: Spacing.four },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rank: { fontSize: 12, fontWeight: '800', width: 18, textAlign: 'right' },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  rowTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  rowCount: { fontSize: 13, fontWeight: '900' },
  rowPct: { fontSize: 11, fontWeight: '600' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
