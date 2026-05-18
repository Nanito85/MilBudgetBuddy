import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Installation } from '@/data/installations';
import {
  DoDEASchool,
  getSchoolInfo,
  PCS_CHECKLIST,
  RIGHTS_DATA,
} from '@/data/schools';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';

// ── Grade badge ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<DoDEASchool['type'], string> = {
  Elementary: '#2E7D32',
  Middle:     '#0277BD',
  High:       '#6A1B9A',
  'K-12':     '#B71C1C',
};

function SchoolCard({ school }: { school: DoDEASchool }) {
  const color = TYPE_COLORS[school.type];
  return (
    <View style={styles.schoolCard}>
      <View style={[styles.schoolTypeBadge, { backgroundColor: color + '22' }]}>
        <ThemedText style={[styles.schoolTypeBadgeText, { color }]}>
          {school.type.toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.schoolCardBody}>
        <ThemedText style={styles.schoolName}>{school.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">Grades {school.grades}</ThemedText>
      </View>
    </View>
  );
}

// ── Expandable section ────────────────────────────────────────────────────────

function ExpandableItem({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      style={({ pressed }) => [styles.expandItem, pressed && styles.pressed]}>
      <View style={styles.expandHeader}>
        <ThemedText style={styles.expandIcon}>{icon}</ThemedText>
        <ThemedText style={styles.expandTitle}>{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.expandChevron}>
          {open ? '▲' : '▼'}
        </ThemedText>
      </View>
      {open && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.expandBody}>
          {body}
        </ThemedText>
      )}
    </Pressable>
  );
}

// ── Tab selector ──────────────────────────────────────────────────────────────

type Tab = 'search' | 'guide' | 'rights';

const TABS: { id: Tab; label: string }[] = [
  { id: 'search', label: 'SCHOOL LOOKUP' },
  { id: 'guide',  label: 'PCS GUIDE' },
  { id: 'rights', label: 'YOUR RIGHTS' },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SchoolsFinderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [installation, setInstallation] = useState<Installation | null>(null);

  const schoolInfo = installation ? getSchoolInfo(installation.id) : null;

  return (
    <ThemedView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            RESOURCES
          </ThemedText>
          <ThemedText style={styles.title}>Schools Finder</ThemedText>
        </View>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={styles.tabItem}>
            <ThemedText
              style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>
              {t.label}
            </ThemedText>
            {activeTab === t.id && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ══ SCHOOL LOOKUP TAB ══════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <>
            <ThemedView type="backgroundElement" style={styles.blufBox}>
              <ThemedText style={styles.blufTitle}>BLUF</ThemedText>
              <ThemedText type="small" style={{ lineHeight: 18 }}>
                Search any installation to see DoDEA on-post schools or the local public
                school district. OCONUS installations use DoDEA exclusively. CONUS
                installations generally feed into local districts funded by Impact Aid.
              </ThemedText>
            </ThemedView>

            <StationPicker
              label="Select Installation"
              selected={installation}
              onSelect={setInstallation}
            />

            {/* Results */}
            {installation && schoolInfo && (
              <View style={styles.section}>
                {/* DoDEA schools */}
                {schoolInfo.hasDoDEA && schoolInfo.dodea.length > 0 && (
                  <>
                    <View style={styles.resultHeader}>
                      <View style={[styles.dodeaBadge]}>
                        <ThemedText style={styles.dodeaBadgeText}>DoDEA ON-POST</ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {installation.name}
                      </ThemedText>
                    </View>
                    <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded]}>
                      {schoolInfo.dodea.map((s, i) => (
                        <React.Fragment key={s.name}>
                          {i > 0 && <View style={styles.schoolDivider} />}
                          <SchoolCard school={s} />
                        </React.Fragment>
                      ))}
                    </ThemedView>
                  </>
                )}

                {/* Local district */}
                {schoolInfo.localDistrict && (
                  <>
                    <View style={styles.resultHeader}>
                      <View style={styles.localBadge}>
                        <ThemedText style={styles.localBadgeText}>LOCAL PUBLIC</ThemedText>
                      </View>
                    </View>
                    <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded]}>
                      <ThemedText style={styles.districtName}>
                        {schoolInfo.localDistrict}
                      </ThemedText>
                      {schoolInfo.districtUrl && (
                        <ThemedText type="small" themeColor="textSecondary">
                          🌐 {schoolInfo.districtUrl}
                        </ThemedText>
                      )}
                    </ThemedView>
                  </>
                )}

                {/* SLO + notes */}
                {(schoolInfo.sloNotes || schoolInfo.notes) && (
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.card, styles.cardPadded, styles.notesCard]}>
                    <ThemedText style={styles.notesLabel}>📌 NOTE</ThemedText>
                    <ThemedText type="small" style={{ lineHeight: 18 }}>
                      {schoolInfo.sloNotes || schoolInfo.notes}
                    </ThemedText>
                  </ThemedView>
                )}
              </View>
            )}

            {installation && !schoolInfo && (
              <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded, styles.noDataCard]}>
                <ThemedText style={styles.noDataIcon}>🔎</ThemedText>
                <ThemedText style={styles.noDataTitle}>No Data for This Installation</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', lineHeight: 18 }}>
                  Contact the School Liaison Officer (SLO) at this installation for school
                  information. Find SLO contacts at dodea.edu/Partnership/schoolliaison
                </ThemedText>
              </ThemedView>
            )}

            {!installation && (
              <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded, styles.noDataCard]}>
                <ThemedText style={styles.noDataIcon}>🏫</ThemedText>
                <ThemedText style={styles.noDataTitle}>Select an Installation</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', lineHeight: 18 }}>
                  Search above to see on-post DoDEA schools or the local public
                  school district for any installation.
                </ThemedText>
              </ThemedView>
            )}

            {/* External resources */}
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                FIND MORE SCHOOLS
              </ThemedText>
              {[
                { icon: '🌐', name: 'DoDEA School Finder',      url: 'dodea.edu/schools',                  desc: 'Official DoDEA school directory' },
                { icon: '🔍', name: 'SchoolQuest',               url: 'schoolquest.militaryonesource.mil',  desc: 'DoD-operated school search tool for military families' },
                { icon: '🤝', name: 'MIC3 Compact',              url: 'mic3.net',                           desc: 'Military Interstate Children\'s Compact — all 50 states + DC' },
                { icon: '📞', name: 'School Liaison Officers',   url: 'dodea.edu/Partnership/schoolliaison', desc: 'Find the SLO at your installation' },
              ].map((r) => (
                <ThemedView key={r.name} type="backgroundElement" style={[styles.card, styles.resourceRow]}>
                  <ThemedText style={styles.resourceIcon}>{r.icon}</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.resourceName}>{r.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{r.desc}</ThemedText>
                    <ThemedText type="small" style={styles.resourceUrl}>{r.url}</ThemedText>
                  </View>
                </ThemedView>
              ))}
            </View>
          </>
        )}

        {/* ══ PCS GUIDE TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'guide' && (
          <>
            <ThemedView type="backgroundElement" style={styles.blufBox}>
              <ThemedText style={styles.blufTitle}>PCS WITH KIDS</ThemedText>
              <ThemedText type="small" style={{ lineHeight: 18 }}>
                School transitions are one of the hardest parts of PCS for military families.
                Follow this checklist to protect your kids' academic progress and keep
                transitions smooth.
              </ThemedText>
            </ThemedView>

            {PCS_CHECKLIST.map((item) => (
              <View key={item.step} style={styles.checkItem}>
                <View style={styles.checkStepBubble}>
                  <ThemedText style={styles.checkStep}>{item.step}</ThemedText>
                </View>
                <View style={styles.checkBody}>
                  <View style={styles.checkTitleRow}>
                    <ThemedText style={styles.checkIcon}>{item.icon}</ThemedText>
                    <ThemedText style={styles.checkTitle}>{item.title}</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.checkDesc}>
                    {item.body}
                  </ThemedText>
                </View>
              </View>
            ))}

            {/* SLO callout */}
            <View style={styles.sloCallout}>
              <ThemedText style={styles.sloIcon}>📞</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.sloTitle}>School Liaison Officer (SLO)</ThemedText>
                <ThemedText type="small" style={styles.sloBody}>
                  Every major installation has a free SLO service. They know the local
                  districts inside-out, have relationships with school principals, and can
                  fast-track your child's enrollment. Always contact them first — it's a
                  free resource most families don't use.
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {/* ══ RIGHTS TAB ═════════════════════════════════════════════════════ */}
        {activeTab === 'rights' && (
          <>
            <ThemedView type="backgroundElement" style={styles.blufBox}>
              <ThemedText style={styles.blufTitle}>KNOW YOUR RIGHTS</ThemedText>
              <ThemedText type="small" style={{ lineHeight: 18 }}>
                Federal law and interstate compacts protect military children from losing
                ground during PCS transitions. Schools that refuse these protections are
                breaking the law — document everything and escalate to the SLO.
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.card, { overflow: 'hidden' }]}>
              {RIGHTS_DATA.map((item, i) => (
                <React.Fragment key={item.title}>
                  {i > 0 && <View style={styles.itemDivider} />}
                  <ExpandableItem icon={item.icon} title={item.title} body={item.body} />
                </React.Fragment>
              ))}
            </ThemedView>

            {/* Escalation path */}
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                IF YOUR RIGHTS ARE VIOLATED
              </ThemedText>
              {[
                { step: '1', text: 'Document the issue in writing — date, school, what was refused.' },
                { step: '2', text: 'Contact your installation School Liaison Officer (SLO) immediately.' },
                { step: '3', text: 'If unresolved, contact the MIC3 State Commissioner for the gaining state.' },
                { step: '4', text: 'Contact your JAG office — McKinney-Vento violations are federal issues.' },
                { step: '5', text: 'File a complaint with the state Department of Education if necessary.' },
              ].map((s) => (
                <ThemedView
                  key={s.step}
                  type="backgroundElement"
                  style={[styles.card, styles.escalationRow]}>
                  <View style={styles.escalationBubble}>
                    <ThemedText style={styles.escalationStep}>{s.step}</ThemedText>
                  </View>
                  <ThemedText style={styles.escalationText}>{s.text}</ThemedText>
                </ThemedView>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
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

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, position: 'relative' },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: '#3D6080' },
  tabLabelActive: { color: Brand.accent },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: Brand.accent,
  },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: Spacing.one },
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two },
  blufBox: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  blufTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: Brand.accent },

  // Results
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.one },
  dodeaBadge: {
    backgroundColor: Brand.primary + '22',
    borderRadius: 99,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  dodeaBadgeText: { fontSize: 10, fontWeight: '800', color: Brand.primary, letterSpacing: 0.6 },
  localBadge: {
    backgroundColor: '#2A9D8F22',
    borderRadius: 99,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  localBadgeText: { fontSize: 10, fontWeight: '800', color: '#2A9D8F', letterSpacing: 0.6 },

  schoolCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  schoolTypeBadge: {
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.one + 2,
    paddingVertical: 3,
    minWidth: 72,
    alignItems: 'center',
  },
  schoolTypeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  schoolCardBody: { flex: 1, gap: 1 },
  schoolName: { fontSize: 14, fontWeight: '600' },
  schoolDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.15)', marginVertical: 4 },

  districtName: { fontSize: 15, fontWeight: '700' },
  notesCard: { backgroundColor: 'rgba(32,138,239,0.08)' },
  notesLabel: { fontSize: 11, fontWeight: '800', color: Brand.primary, letterSpacing: 0.5 },

  noDataCard: { alignItems: 'center', gap: Spacing.two },
  noDataIcon: { fontSize: 36 },
  noDataTitle: { fontSize: 16, fontWeight: '700' },

  // Resources
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  resourceIcon: { fontSize: 22, width: 32, textAlign: 'center', marginTop: 1 },
  resourceName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  resourceUrl: { color: Brand.primary, fontSize: 11, marginTop: 2 },

  // PCS Checklist
  checkItem: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  checkStepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkStep: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  checkBody: {
    flex: 1,
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: Spacing.two,
    padding: Spacing.two + 2,
    gap: 4,
  },
  checkTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  checkIcon: { fontSize: 16 },
  checkTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  checkDesc: { lineHeight: 17 },

  sloCallout: {
    flexDirection: 'row',
    gap: Spacing.two,
    backgroundColor: Brand.primary + '15',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.primary + '40',
    padding: Spacing.three,
  },
  sloIcon: { fontSize: 24, width: 32, textAlign: 'center', marginTop: 2 },
  sloTitle: { fontSize: 14, fontWeight: '800', color: Brand.primary, marginBottom: 4 },
  sloBody: { lineHeight: 17, color: Brand.primary + 'CC' },

  // Rights
  expandItem: { padding: Spacing.three, gap: Spacing.one + 2 },
  expandHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  expandIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  expandTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  expandChevron: { fontSize: 10 },
  expandBody: { lineHeight: 18, paddingLeft: 26 + Spacing.two },
  itemDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },

  // Escalation
  escalationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.two + 2,
    gap: Spacing.two,
  },
  escalationBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  escalationStep: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  escalationText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
