import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { NetWorthCategory, NetWorthEntry, useNetWorthStore } from '@/store/networth.store';
import { NwSnapshot, useNwSnapshotsStore } from '@/store/networth-snapshots.store';

function fmtDollar(n: number): string {
  if (n === 0) return '$0';
  const abs = Math.abs(n);
  const s = abs >= 1_000_000
    ? `$${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
    ? `$${(abs / 1_000).toFixed(1)}K`
    : `$${abs.toLocaleString()}`;
  return n < 0 ? `-${s}` : s;
}

function fmtFull(n: number): string {
  return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

// ── Entry row ────────────────────────────────────────────────────────────────

interface EntryRowProps {
  entry: NetWorthEntry;
  isDefault: boolean;
}

function EntryRow({ entry, isDefault }: EntryRowProps) {
  const tc = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [val, setVal] = useState(entry.amount > 0 ? String(entry.amount) : '');
  const [labelVal, setLabelVal] = useState(entry.label);
  const updateEntry = useNetWorthStore((s) => s.updateEntry);
  const removeEntry = useNetWorthStore((s) => s.removeEntry);

  const isAsset = entry.category === 'asset';
  const accentColor = isAsset ? Brand.tactical : Brand.danger;

  const commitAmount = () => {
    const n = parseFloat(val);
    updateEntry(entry.id, isNaN(n) ? 0 : Math.max(0, n));
    setEditing(false);
  };

  const commitLabel = () => {
    const trimmed = labelVal.trim();
    if (trimmed) updateEntry(entry.id, entry.amount, trimmed);
    setEditingLabel(false);
  };

  const handleLongPress = () => {
    if (isDefault) return;
    Alert.alert('Remove Entry', `Remove "${entry.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeEntry(entry.id) },
    ]);
  };

  return (
    <Pressable onLongPress={handleLongPress}>
      <ThemedView type="backgroundElement" style={styles.entryRow}>
        <View style={[styles.rowAccent, { backgroundColor: accentColor }]} />
        <View style={styles.entryInfo}>
          {!isDefault && editingLabel ? (
            <TextInput
              value={labelVal}
              onChangeText={setLabelVal}
              onBlur={commitLabel}
              onSubmitEditing={commitLabel}
              autoFocus
              style={styles.labelInput}
              returnKeyType="done"
            />
          ) : (
            <Pressable onPress={!isDefault ? () => { setLabelVal(entry.label); setEditingLabel(true); } : undefined}>
              <ThemedText style={[styles.entryLabel, { color: tc.textPrimary }]}>{entry.label}</ThemedText>
            </Pressable>
          )}
          {!isDefault && !editingLabel && (
            <ThemedText style={[styles.tapHint, { color: tc.textMuted }]}>Tap to rename · Long-press to delete</ThemedText>
          )}
        </View>
        {editing ? (
          <TextInput
            value={val}
            onChangeText={setVal}
            onBlur={commitAmount}
            onSubmitEditing={commitAmount}
            keyboardType="decimal-pad"
            autoFocus
            style={[styles.amountInput, { borderBottomColor: accentColor, color: tc.textPrimary }]}
            placeholder="0"
          />
        ) : (
          <Pressable
            onPress={() => { setVal(entry.amount > 0 ? String(entry.amount) : ''); setEditing(true); }}
            style={styles.amountBtn}>
            <ThemedText style={[styles.entryAmount, { color: entry.amount > 0 ? accentColor : tc.textMuted }]}>
              {entry.amount > 0 ? fmtDollar(entry.amount) : 'Set'}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </Pressable>
  );
}

function AddRow({ category, onAdd }: { category: NetWorthCategory; onAdd: (label: string) => void }) {
  const tc = useThemeColors();
  const [name, setName] = useState('');
  const ref = useRef<TextInput>(null);

  const submit = () => {
    const t = name.trim();
    if (!t) return;
    onAdd(t);
    setName('');
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.addRow, { borderColor: tc.borderColor }]}>
      <ThemedText style={[styles.addPlus, { color: tc.textMuted }]}>＋</ThemedText>
      <TextInput
        ref={ref}
        value={name}
        onChangeText={setName}
        placeholder={`Add ${category === 'asset' ? 'asset' : 'liability'}...`}
        placeholderTextColor="rgba(128,128,128,0.4)"
        style={[styles.addInput, { color: tc.textPrimary }]}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {name.trim().length > 0 && (
        <Pressable onPress={submit} style={[styles.addBtn, { backgroundColor: category === 'asset' ? Brand.tactical : Brand.danger }]}>
          <ThemedText style={styles.addBtnText}>Add</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

// ── History bar chart ────────────────────────────────────────────────────────

function HistoryChart({ snapshots }: { snapshots: NwSnapshot[] }) {
  const tc = useThemeColors();
  if (snapshots.length === 0) return null;

  const maxAbs = Math.max(...snapshots.map((s) => Math.abs(s.netWorth)), 1);
  const BAR_HEIGHT = 80;

  return (
    <View style={styles.chartWrap}>
      {snapshots.map((snap, i) => {
        const nw = snap.netWorth;
        const barH = Math.round((Math.abs(nw) / maxAbs) * BAR_HEIGHT);
        const positive = nw >= 0;
        const dateLabel = new Date(snap.date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short', year: '2-digit',
        });

        return (
          <View key={snap.date} style={styles.chartCol}>
            {/* positive bar grows upward */}
            <View style={{ height: BAR_HEIGHT, justifyContent: 'flex-end' }}>
              {positive && (
                <View style={[styles.chartBar, { height: barH, backgroundColor: Brand.tactical }]} />
              )}
            </View>
            {/* negative bar grows downward */}
            <View style={{ height: BAR_HEIGHT, justifyContent: 'flex-start' }}>
              {!positive && (
                <View style={[styles.chartBar, { height: barH, backgroundColor: Brand.danger }]} />
              )}
            </View>
            <ThemedText style={[styles.chartLabel, { color: tc.textMuted }]}>{dateLabel}</ThemedText>
            <ThemedText style={[styles.chartValue, { color: positive ? Brand.tactical : Brand.danger }]}>
              {fmtDollar(nw)}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

const DEFAULT_ASSET_IDS = new Set(['checking', 'tsp', 'vehicle', 'home_equity', 'investments']);
const DEFAULT_LIABILITY_IDS = new Set(['car_loan', 'credit_cards', 'student_loan', 'mortgage', 'other_debt']);

type Mode = 'tracker' | 'history';

export default function NetWorthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const [mode, setMode] = useState<Mode>('tracker');

  const entries = useNetWorthStore((s) => s.entries);
  const totalAssets = useNetWorthStore((s) => s.totalAssets)();
  const totalLiabilities = useNetWorthStore((s) => s.totalLiabilities)();
  const netWorth = useNetWorthStore((s) => s.netWorth)();
  const addEntry = useNetWorthStore((s) => s.addEntry);

  const snapshots = useNwSnapshotsStore((s) => s.snapshots);
  const saveSnapshot = useNwSnapshotsStore((s) => s.saveSnapshot);
  const clearHistory = useNwSnapshotsStore((s) => s.clearHistory);

  useEffect(() => {
    useNetWorthStore.getState().hydrate();
    useNwSnapshotsStore.getState().hydrate();
  }, []);

  const assets = entries.filter((e) => e.category === 'asset');
  const liabilities = entries.filter((e) => e.category === 'liability');

  const isPositive = netWorth >= 0;
  const pctAssets = totalAssets > 0
    ? Math.min(1, totalAssets / Math.max(totalAssets, totalLiabilities))
    : 0;

  const handleSaveSnapshot = () => {
    saveSnapshot(totalAssets, totalLiabilities);
    Alert.alert('Snapshot Saved', `Net worth of ${fmtFull(netWorth)} saved for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`);
  };

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Delete all historical snapshots? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  // Net worth change since earliest snapshot
  const firstSnap = snapshots[0];
  const lastSnap = snapshots[snapshots.length - 1];
  const totalChange = snapshots.length >= 2 ? netWorth - firstSnap.netWorth : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={() => (router.back())}
            style={styles.back}>
            <ThemedText style={styles.backChevron}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>Net Worth</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('tracker')} style={[styles.modeBtn, { borderColor: tc.borderColor }, mode === 'tracker' && styles.modeBtnActive]}>
            <ThemedText style={[styles.modeBtnText, { color: tc.textMuted }, mode === 'tracker' && styles.modeBtnTextActive]}>TRACKER</ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('history')} style={[styles.modeBtn, { borderColor: tc.borderColor }, mode === 'history' && styles.modeBtnActive]}>
            <ThemedText style={[styles.modeBtnText, { color: tc.textMuted }, mode === 'history' && styles.modeBtnTextActive]}>
              HISTORY {snapshots.length > 0 ? `(${snapshots.length})` : ''}
            </ThemedText>
          </Pressable>
        </View>

        {/* Summary */}
        <ThemedView type="backgroundElement" style={styles.summaryCard}>
          <ThemedText style={[styles.summaryEyebrow, { color: tc.textHint }]}>YOUR NET WORTH</ThemedText>
          <ThemedText style={[styles.summaryTotal, { color: isPositive ? Brand.tactical : Brand.danger }]}>
            {isPositive ? '' : '-'}{fmtFull(Math.abs(netWorth))}
          </ThemedText>

          <View style={styles.barRow}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pctAssets * 100}%` as any, backgroundColor: Brand.tactical }]} />
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Brand.tactical }]} />
              <ThemedText style={[styles.legendLabel, { color: tc.textHint }]}>Assets</ThemedText>
              <ThemedText style={[styles.legendValue, { color: Brand.tactical }]}>{fmtDollar(totalAssets)}</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Brand.danger }]} />
              <ThemedText style={[styles.legendLabel, { color: tc.textHint }]}>Liabilities</ThemedText>
              <ThemedText style={[styles.legendValue, { color: Brand.danger }]}>{fmtDollar(totalLiabilities)}</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.five }]}
          keyboardShouldPersistTaps="handled">

          {mode === 'tracker' && (
            <>
              <ThemedText style={[styles.hint, { color: tc.textMuted }]}>Tap an amount to edit.</ThemedText>

              <View style={styles.sectionLabelRow}>
                <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
                <ThemedText style={[styles.sectionLabel, { color: tc.textMuted }]}>ASSETS</ThemedText>
                <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
              </View>
              {assets.map((e) => (
                <EntryRow key={e.id} entry={e} isDefault={DEFAULT_ASSET_IDS.has(e.id)} />
              ))}
              <AddRow category="asset" onAdd={(label) => addEntry(label, 'asset')} />

              <View style={[styles.sectionLabelRow, { marginTop: Spacing.two }]}>
                <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
                <ThemedText style={[styles.sectionLabel, { color: tc.textMuted }]}>LIABILITIES</ThemedText>
                <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
              </View>
              {liabilities.map((e) => (
                <EntryRow key={e.id} entry={e} isDefault={DEFAULT_LIABILITY_IDS.has(e.id)} />
              ))}
              <AddRow category="liability" onAdd={(label) => addEntry(label, 'liability')} />

              <Pressable onPress={handleSaveSnapshot} style={styles.snapshotBtn}>
                <ThemedText style={styles.snapshotBtnText}>📸 Save Monthly Snapshot</ThemedText>
              </Pressable>
              <ThemedText style={[styles.snapshotHint, { color: tc.textMuted }]}>
                Save once a month to build your trend history.
              </ThemedText>
            </>
          )}

          {mode === 'history' && (
            <>
              {snapshots.length === 0 ? (
                <ThemedView type="backgroundElement" style={styles.emptyBox}>
                  <ThemedText style={styles.emptyTitle}>No history yet</ThemedText>
                  <ThemedText style={[styles.emptyBody, { color: tc.textHint }]}>
                    Switch to TRACKER and tap &quot;Save Monthly Snapshot&quot; after updating your balances each month.
                  </ThemedText>
                </ThemedView>
              ) : (
                <>
                  {totalChange !== null && (
                    <ThemedView type="backgroundElement" style={styles.changeCard}>
                      <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>CHANGE SINCE {new Date(firstSnap.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}</ThemedText>
                      <ThemedText style={[styles.changeValue, { color: totalChange >= 0 ? Brand.tactical : Brand.danger }]}>
                        {totalChange >= 0 ? '+' : ''}{fmtFull(totalChange)}
                      </ThemedText>
                    </ThemedView>
                  )}

                  <ThemedView type="backgroundElement" style={styles.chartCard}>
                    <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>NET WORTH TREND</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <HistoryChart snapshots={snapshots} />
                    </ScrollView>
                  </ThemedView>

                  <ThemedView type="backgroundElement" style={styles.tableCard}>
                    <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>SNAPSHOT HISTORY</ThemedText>
                    {[...snapshots].reverse().map((snap) => {
                      const dateLabel = new Date(snap.date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      });
                      return (
                        <View key={snap.date} style={[styles.snapRow, { borderBottomColor: tc.borderColor }]}>
                          <ThemedText style={[styles.snapDate, { color: tc.textHint }]}>{dateLabel}</ThemedText>
                          <View style={styles.snapRight}>
                            <ThemedText style={[styles.snapNw, { color: snap.netWorth >= 0 ? Brand.tactical : Brand.danger }]}>
                              {fmtDollar(snap.netWorth)}
                            </ThemedText>
                            <ThemedText style={[styles.snapSub, { color: tc.textMuted }]}>
                              A: {fmtDollar(snap.assets)} · L: {fmtDollar(snap.liabilities)}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </ThemedView>

                  <Pressable onPress={handleClearHistory} style={styles.clearBtn}>
                    <ThemedText style={styles.clearBtnText}>Clear History</ThemedText>
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  modeBtn: {
    flex: 1, paddingVertical: Spacing.one + 2, borderRadius: 4,
    borderWidth: 1, borderColor: Brand.border, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  modeBtnText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  modeBtnTextActive: { color: '#000' },

  summaryCard: {
    marginHorizontal: Spacing.three,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  summaryEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  summaryTotal: { fontSize: 26, fontWeight: '900', lineHeight: 32 },
  barRow: { marginTop: Spacing.two },
  barTrack: { height: 6, backgroundColor: Brand.danger + '40', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  legendRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.one },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '600' },
  legendValue: { fontSize: 11, fontWeight: '800' },

  list: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  hint: { fontSize: 11, textAlign: 'center' },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: 1, backgroundColor: Brand.border },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  entryRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 4,
    overflow: 'hidden', gap: Spacing.two,
  },
  rowAccent: { width: 3, alignSelf: 'stretch' },
  entryInfo: { flex: 1, paddingVertical: Spacing.two, gap: 2 },
  entryLabel: { fontSize: 13, fontWeight: '600' },
  tapHint: { fontSize: 9 },
  labelInput: {
    fontSize: 13, fontWeight: '600', color: Brand.primary,
    borderBottomWidth: 1.5, borderBottomColor: Brand.primary, paddingVertical: 2,
  },
  amountBtn: { paddingRight: Spacing.two },
  entryAmount: { fontSize: 15, fontWeight: '700' },
  amountInput: {
    fontSize: 15, fontWeight: '700',
    minWidth: 80, textAlign: 'right', borderBottomWidth: 2,
    paddingVertical: 2, marginRight: Spacing.two,
  },
  addRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 4,
    padding: Spacing.two + 4, gap: Spacing.two, borderWidth: 1.5,
    borderStyle: 'dashed', borderColor: Brand.border,
  },
  addPlus: { fontSize: 16, width: 24, textAlign: 'center' },
  addInput: { flex: 1, fontSize: 14 },
  addBtn: { borderRadius: 4, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.one + 2 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  snapshotBtn: {
    backgroundColor: Brand.accent + '20',
    borderRadius: 4,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.accent + '60',
    marginTop: Spacing.two,
  },
  snapshotBtnText: { fontSize: 14, fontWeight: '700', color: Brand.accent },
  snapshotHint: { fontSize: 10, textAlign: 'center' },

  // History mode
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  changeCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one },
  changeValue: { fontSize: 26, fontWeight: '900', lineHeight: 32 },

  chartCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, paddingVertical: Spacing.one },
  chartCol: { alignItems: 'center', minWidth: 44 },
  chartBar: { width: 28, borderRadius: 3 },
  chartLabel: { fontSize: 9, marginTop: Spacing.one, textAlign: 'center' },
  chartValue: { fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 },

  tableCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one + 2 },
  snapRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  snapDate: { fontSize: 12 },
  snapRight: { alignItems: 'flex-end', gap: 2 },
  snapNw: { fontSize: 14, fontWeight: '700' },
  snapSub: { fontSize: 10 },

  clearBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
  },
  clearBtnText: { fontSize: 12, color: Brand.danger },

  emptyBox: {
    borderRadius: 4, padding: Spacing.three + 4, alignItems: 'center', gap: Spacing.two,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
