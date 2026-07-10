import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
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
import {
  LESField,
  LESSection,
  RED_FLAGS,
  searchLESFields,
} from '@/data/les-fields';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'glossary' | 'verify' | 'redflags';

const TABS: { id: Tab; label: string }[] = [
  { id: 'glossary',  label: 'GLOSSARY' },
  { id: 'verify',    label: 'VERIFY PAY' },
  { id: 'redflags',  label: 'RED FLAGS' },
];

const SECTION_META: Record<LESSection, { label: string; color: string; icon: string }> = {
  entitlements: { label: 'ENTITLEMENTS', color: '#00C8A8', icon: '💰' },
  deductions:   { label: 'DEDUCTIONS',   color: '#FF6B35', icon: '📉' },
  leave:        { label: 'LEAVE',        color: '#C8A800', icon: '📅' },
  admin:        { label: 'ADMIN / ID',   color: '#208AEF', icon: '🪪' },
};

const SEVERITY_COLORS = {
  HIGH:   { bg: 'rgba(204,32,32,0.12)', border: 'rgba(204,32,32,0.4)', text: '#CC2020' },
  MEDIUM: { bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.4)', text: '#FF6B35' },
  INFO:   { bg: 'rgba(200,168,0,0.12)', border: 'rgba(200,168,0,0.35)', text: '#C8A800' },
};

// ── Field card (expandable) ────────────────────────────────────────────────────

function FieldCard({ field }: { field: LESField }) {
  const [open, setOpen] = useState(false);
  const meta = SECTION_META[field.section];

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => [styles.fieldCard, pressed && styles.pressed]}>
      {/* Left accent */}
      <View style={[styles.fieldAccent, { backgroundColor: meta.color }]} />

      <View style={styles.fieldBody}>
        {/* Header row */}
        <View style={styles.fieldHeaderRow}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.fieldName}>{field.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldPlain}>
              {field.plainName}
            </ThemedText>
          </View>
          <ThemedText themeColor="textSecondary" style={styles.fieldChevron}>
            {open ? '▲' : '▼'}
          </ThemedText>
        </View>

        {/* Summary always visible */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.fieldSummary}>
          {field.summary}
        </ThemedText>

        {/* Expanded detail */}
        {open && (
          <View style={styles.fieldDetail}>
            <ThemedText type="small" style={styles.fieldDetailText}>
              {field.detail}
            </ThemedText>
            {field.formula && (
              <View style={styles.formulaBox}>
                <ThemedText style={styles.formulaLabel}>FORMULA</ThemedText>
                <ThemedText type="small" style={styles.formulaText}>{field.formula}</ThemedText>
              </View>
            )}
            {field.tip && (
              <View style={styles.tipBox}>
                <ThemedText style={styles.tipLabel}>⚡ WATCH OUT</ThemedText>
                <ThemedText type="small" style={styles.tipText}>{field.tip}</ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Verify row ─────────────────────────────────────────────────────────────────

function VerifyRow({
  label,
  expected,
  entered,
  formula,
}: {
  label: string;
  expected: number;
  entered: number;
  formula?: string;
}) {
  const diff = entered - expected;
  const ok = Math.abs(diff) < 2; // within $2 = fine (rounding)
  const color = ok ? '#00C8A8' : '#FF6B35';
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

  return (
    <View style={styles.vRow}>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.vLabel}>{label}</ThemedText>
        {formula && (
          <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, lineHeight: 15 }}>
            Expected: {fmt(expected)} {formula}
          </ThemedText>
        )}
      </View>
      <View style={styles.vStatus}>
        <ThemedText style={[styles.vCheck, { color }]}>{ok ? '✓' : '✗'}</ThemedText>
        {!ok && (
          <ThemedText type="small" style={[styles.vDiff, { color }]}>
            {diff > 0 ? '+' : ''}{fmt(diff)}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function LESDecoderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [activeTab, setActiveTab] = useState<Tab>('glossary');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<LESSection | 'all'>('all');

  // Verify tab inputs
  const [basicPayText, setBasicPayText]   = useState('');
  const [ficaText, setFicaText]           = useState('');
  const [ficaMedText, setFicaMedText]     = useState('');
  const [netPayText, setNetPayText]       = useState('');
  const [totalEntText, setTotalEntText]   = useState('');
  const [totalDedText, setTotalDedText]   = useState('');

  const basicPay   = parseFloat(basicPayText)   || 0;
  const ficaEntered = parseFloat(ficaText)       || 0;
  const ficaMedEntered = parseFloat(ficaMedText) || 0;
  const netEntered  = parseFloat(netPayText)     || 0;
  const totalEnt    = parseFloat(totalEntText)   || 0;
  const totalDed    = parseFloat(totalDedText)   || 0;

  const expectedFica    = basicPay * 0.062;
  const expectedFicaMed = basicPay * 0.0145;
  const expectedNet     = totalEnt - totalDed;

  // Glossary filtered results
  const allResults = useMemo(() => searchLESFields(searchQuery), [searchQuery]);
  const filtered = useMemo(
    () => (activeSection === 'all' ? allResults : allResults.filter((f) => f.section === activeSection)),
    [allResults, activeSection],
  );

  // Group by section for grouped display
  const grouped = useMemo(() => {
    const map = new Map<LESSection, LESField[]>();
    for (const f of filtered) {
      const arr = map.get(f.section) ?? [];
      arr.push(f);
      map.set(f.section, arr);
    }
    return map;
  }, [filtered]);

  const sectionOrder: LESSection[] = ['entitlements', 'deductions', 'leave', 'admin'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            RESOURCES
          </ThemedText>
          <ThemedText style={styles.title}>LES Decoder</ThemedText>
        </View>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={styles.tabItem}>
            <ThemedText style={[styles.tabLabel, { color: tc.textMuted }, activeTab === t.id && styles.tabLabelActive]}>
              {t.label}
            </ThemedText>
            {activeTab === t.id && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {/* ══ GLOSSARY TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'glossary' && (
        <>
          {/* Search bar */}
          <View style={[styles.searchWrap, { backgroundColor: tc.surface }]}>
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search LES fields..."
              placeholderTextColor={tc.textSecondary}
              style={[styles.searchInput, { color: tc.textPrimary }]}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Section filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}>
            {(['all', ...sectionOrder] as const).map((s) => {
              const meta = s === 'all' ? null : SECTION_META[s];
              const active = activeSection === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setActiveSection(s)}
                  style={[
                    styles.filterChip,
                    active && { backgroundColor: (meta?.color ?? Brand.accent) + '22', borderColor: meta?.color ?? Brand.accent },
                  ]}>
                  {meta && <ThemedText style={{ fontSize: 12 }}>{meta.icon}</ThemedText>}
                  <ThemedText style={[styles.filterChipText, { color: tc.textMuted }, active && { color: meta?.color ?? Brand.accent }]}>
                    {s === 'all' ? 'ALL' : meta!.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">

            {searchQuery.trim() || activeSection !== 'all' ? (
              // Flat list for search results
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.resultCount}>
                  {filtered.length} field{filtered.length === 1 ? '' : 's'}
                </ThemedText>
                {filtered.map((f) => <FieldCard key={f.id} field={f} />)}
              </>
            ) : (
              // Grouped display
              sectionOrder.map((section) => {
                const fields = grouped.get(section);
                if (!fields?.length) return null;
                const meta = SECTION_META[section];
                return (
                  <View key={section} style={styles.sectionGroup}>
                    <View style={styles.sectionGroupLabel}>
                      <ThemedText style={styles.sectionGroupIcon}>{meta.icon}</ThemedText>
                      <ThemedText style={[styles.sectionGroupTitle, { color: meta.color }]}>
                        {meta.label}
                      </ThemedText>
                      <View style={[styles.sectionGroupLine, { backgroundColor: meta.color + '40' }]} />
                    </View>
                    {fields.map((f) => <FieldCard key={f.id} field={f} />)}
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      {/* ══ VERIFY PAY TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'verify' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <ThemedView type="backgroundElement" style={styles.blufBox}>
            <ThemedText style={styles.blufTitle}>HOW TO USE</ThemedText>
            <ThemedText type="small" style={{ lineHeight: 18 }}>
              Open your LES on myPay.dfas.mil and enter the numbers below. This tool
              checks whether your FICA taxes and net pay math are correct. Discrepancies
              larger than $2 (rounding) should be reported to finance.
            </ThemedText>
          </ThemedView>

          {/* Input card */}
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              ENTER YOUR LES NUMBERS
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              {[
                { label: 'BASEPAY (monthly)',        value: basicPayText,   set: setBasicPayText,  placeholder: 'e.g. 3451' },
                { label: 'FICA SOC SEC TAX',         value: ficaText,       set: setFicaText,      placeholder: 'e.g. 214' },
                { label: 'FICA MED TAX',             value: ficaMedText,    set: setFicaMedText,   placeholder: 'e.g. 50' },
                { label: 'TOTAL ENT (gross)',        value: totalEntText,   set: setTotalEntText,  placeholder: 'e.g. 6200' },
                { label: 'TOTAL DED (total deductions)', value: totalDedText, set: setTotalDedText, placeholder: 'e.g. 900' },
                { label: 'NET AMT (take-home)',      value: netPayText,     set: setNetPayText,    placeholder: 'e.g. 5300' },
              ].map((f, i, arr) => (
                <React.Fragment key={f.label}>
                  <View style={styles.inputRow}>
                    <ThemedText style={styles.inputLabel}>{f.label}</ThemedText>
                    <TextInput
                      style={[styles.input, { color: tc.textPrimary, borderColor: 'rgba(128,128,128,0.3)' }]}
                      keyboardType="decimal-pad"
                      value={f.value}
                      onChangeText={f.set}
                      placeholder={f.placeholder}
                      placeholderTextColor={tc.textSecondary}
                    />
                  </View>
                  {i < arr.length - 1 && <View style={styles.inputDivider} />}
                </React.Fragment>
              ))}
            </ThemedView>
          </View>

          {/* Verification results */}
          {basicPay > 0 && (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                VERIFICATION
              </ThemedText>
              <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded]}>
                {ficaEntered > 0 && (
                  <VerifyRow
                    label="Social Security Tax (FICA)"
                    expected={expectedFica}
                    entered={ficaEntered}
                    formula={`= $${basicPay.toFixed(0)} × 6.2%`}
                  />
                )}
                {ficaMedEntered > 0 && (
                  <>
                    <View style={styles.verifyDivider} />
                    <VerifyRow
                      label="Medicare Tax (FICA)"
                      expected={expectedFicaMed}
                      entered={ficaMedEntered}
                      formula={`= $${basicPay.toFixed(0)} × 1.45%`}
                    />
                  </>
                )}
                {totalEnt > 0 && totalDed > 0 && netEntered > 0 && (
                  <>
                    <View style={styles.verifyDivider} />
                    <VerifyRow
                      label="Net Pay Math"
                      expected={expectedNet}
                      entered={netEntered}
                      formula={`= $${totalEnt.toFixed(0)} − $${totalDed.toFixed(0)}`}
                    />
                  </>
                )}
              </ThemedView>
            </View>
          )}

          {basicPay === 0 && (
            <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded, styles.emptyState]}>
              <ThemedText style={{ fontSize: 32 }}>📋</ThemedText>
              <ThemedText style={styles.emptyTitle}>Enter Your BASEPAY</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', lineHeight: 18 }}>
                Start by entering your Basic Pay from the LES to enable math verification.
              </ThemedText>
            </ThemedView>
          )}

          {/* How to read your LES */}
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              WHERE TO FIND THESE NUMBERS
            </ThemedText>
            {[
              { field: 'BASEPAY', where: 'Entitlements block, first line — your core monthly salary' },
              { field: 'FICA SOC SEC TAX', where: 'Deductions block — "FICA SOC SEC TAX" line' },
              { field: 'FICA MED TAX', where: 'Deductions block — "FICA MED TAX" line' },
              { field: 'TOTAL ENT', where: 'Bottom summary row — total of all entitlements this period' },
              { field: 'TOTAL DED', where: 'Bottom summary row — total of all deductions this period' },
              { field: 'NET AMT', where: 'Bottom right corner — what actually hits your bank account' },
            ].map((item) => (
              <ThemedView key={item.field} type="backgroundElement" style={[styles.card, styles.whereRow]}>
                <ThemedText style={styles.whereField}>{item.field}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.whereDesc}>{item.where}</ThemedText>
              </ThemedView>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ══ RED FLAGS TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'redflags' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
          showsVerticalScrollIndicator={false}>

          <ThemedView type="backgroundElement" style={styles.blufBox}>
            <ThemedText style={styles.blufTitle}>CHECK EVERY MONTH</ThemedText>
            <ThemedText type="small" style={{ lineHeight: 18 }}>
              Most pay errors go unreported because members don't know what to look for.
              Review your LES every pay period against this list. DFAS has correction
              windows — the sooner you catch an error, the easier it is to fix.
            </ThemedText>
          </ThemedView>

          {(['HIGH', 'MEDIUM', 'INFO'] as const).map((severity) => {
            const items = RED_FLAGS.filter((f) => f.severity === severity);
            const meta = SEVERITY_COLORS[severity];
            const label = severity === 'HIGH' ? 'CRITICAL ERRORS' : severity === 'MEDIUM' ? 'COMMON ISSUES' : 'OPTIMIZE YOUR PAY';
            return (
              <View key={severity} style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                  {label}
                </ThemedText>
                {items.map((flag) => (
                  <View
                    key={flag.title}
                    style={[styles.flagCard, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                    <View style={styles.flagHeader}>
                      <ThemedText style={styles.flagIcon}>{flag.icon}</ThemedText>
                      <ThemedText style={[styles.flagTitle, { color: meta.text }]}>{flag.title}</ThemedText>
                      <View style={[styles.severityBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
                        <ThemedText style={[styles.severityText, { color: meta.text }]}>{severity}</ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={[styles.flagBody, { color: meta.text + 'CC' }]}>
                      {flag.body}
                    </ThemedText>
                    <View style={styles.actionBox}>
                      <ThemedText style={[styles.actionLabel, { color: meta.text }]}>ACTION ›</ThemedText>
                      <ThemedText type="small" style={[styles.actionText, { color: meta.text }]}>
                        {flag.action}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          {/* Footer */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            Pay errors can be corrected retroactively through DFAS. Start the process through
            your unit S1 / Personnel office. References: DoD FMR Vol 7A, DFAS LES User Guide
            (dfas.mil), SCRA (50 USC §3901).
          </ThemedText>
        </ScrollView>
      )}
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', lineHeight: 34 },
  headerText: { gap: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  pressed: { opacity: 0.6 },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, position: 'relative' },
  tabLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  tabLabelActive: { color: Brand.accent },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 8, right: 8,
    height: 2, borderRadius: 1, backgroundColor: Brand.accent,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.three, marginTop: Spacing.two, marginBottom: Spacing.one,
    borderRadius: Spacing.two, paddingHorizontal: Spacing.two, gap: Spacing.one,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: Spacing.two },

  filterRow: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.three, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1, borderColor: 'rgba(128,128,128,0.25)',
  },
  filterChipText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two },
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: Spacing.one },
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two },
  resultCount: { paddingHorizontal: Spacing.one, marginBottom: 2 },

  sectionGroup: { gap: Spacing.one },
  sectionGroupLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingHorizontal: Spacing.one },
  sectionGroupIcon: { fontSize: 14 },
  sectionGroupTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  sectionGroupLine: { flex: 1, height: 1, marginLeft: 4 },

  fieldCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(128,128,128,0.07)',
    borderRadius: Spacing.two,
    overflow: 'hidden',
    marginBottom: 4,
  },
  fieldAccent: { width: 3 },
  fieldBody: { flex: 1, padding: Spacing.two + 2, gap: 4 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  fieldName: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  fieldPlain: { fontSize: 13, marginTop: 1 },
  fieldChevron: { fontSize: 13, marginTop: 3 },
  fieldSummary: { lineHeight: 20, fontSize: 14 },
  fieldDetail: { gap: Spacing.one, marginTop: 4 },
  fieldDetailText: { lineHeight: 20, fontSize: 14 },
  formulaBox: {
    backgroundColor: 'rgba(32,138,239,0.08)',
    borderRadius: Spacing.one,
    padding: Spacing.two,
    gap: 2,
  },
  formulaLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#208AEF' },
  formulaText: { fontSize: 13, fontFamily: 'monospace', color: '#208AEF' },
  tipBox: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: Spacing.one,
    padding: Spacing.two,
    gap: 2,
  },
  tipLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#FF6B35' },
  tipText: { fontSize: 13, color: '#FF6B35CC', lineHeight: 18 },

  blufBox: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  blufTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: Brand.accent },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: 10,
  },
  inputLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two, paddingVertical: 7,
    minWidth: 110, textAlign: 'right', fontSize: 15, fontWeight: '600',
  },
  inputDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.15)', marginHorizontal: Spacing.three },

  vRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 4 },
  vLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  vStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vCheck: { fontSize: 18, fontWeight: '700' },
  vDiff: { fontSize: 12, fontWeight: '700' },
  verifyDivider: { height: 1, backgroundColor: 'rgba(128,128,128,0.15)', marginVertical: 2 },

  emptyState: { alignItems: 'center', gap: Spacing.two },
  emptyTitle: { fontSize: 15, fontWeight: '700' },

  whereRow: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.two + 2, gap: Spacing.two },
  whereField: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3, minWidth: 130 },
  whereDesc: { flex: 1, lineHeight: 20, fontSize: 13 },

  flagCard: {
    borderRadius: Spacing.three, borderWidth: 1,
    padding: Spacing.three, gap: Spacing.one + 2,
  },
  flagHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  flagIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  flagTitle: { flex: 1, fontSize: 14, fontWeight: '800' },
  severityBadge: {
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: Spacing.one + 2, paddingVertical: 2,
  },
  severityText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  flagBody: { lineHeight: 20, fontSize: 14 },
  actionBox: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Spacing.one, padding: Spacing.two, gap: 3,
  },
  actionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  actionText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  disclaimer: {
    textAlign: 'center', lineHeight: 20, fontSize: 13,
    paddingHorizontal: Spacing.two, paddingTop: Spacing.two,
  },
});
