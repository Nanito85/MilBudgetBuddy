import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { PayGrade } from '@/data/bah-rates';
import { Brand, Spacing } from '@/constants/theme';
import { BRANCH_COLORS, MilitaryBranch, getRankAbbrev } from '@/types/user.types';

interface Props {
  branch?: MilitaryBranch;
  payGrade?: PayGrade;
  lastName?: string;
  nickname?: string;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'ZERO DARK';
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

const BRANCH_DESIGNATOR: Record<MilitaryBranch, string> = {
  army: 'U.S. ARMY',
  navy: 'U.S. NAVY',
  marines: 'U.S.M.C.',
  air_force: 'U.S.A.F.',
  space_force: 'U.S.S.F.',
  coast_guard: 'U.S.C.G.',
  other: 'MIL.',
};

export function DashboardHeader({ branch, payGrade, lastName, nickname }: Props) {
  const insets = useSafeAreaInsets();
  const branchColor = branch ? (BRANCH_COLORS[branch] ?? Brand.primary) : Brand.primary;
  const branchLabel = branch ? BRANCH_DESIGNATOR[branch] : 'MILBUDGETBUDDY';

  let displayName = 'SERVICEMEMBER';
  if (nickname) {
    displayName = nickname.toUpperCase();
  } else if (payGrade && lastName) {
    displayName = `${getRankAbbrev(branch, payGrade)} ${lastName.toUpperCase()}`;
  } else if (lastName) {
    displayName = lastName.toUpperCase();
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Classification bar */}
      <View style={styles.classBar}>
        <ThemedText type="classified">■ FOR OFFICIAL USE ONLY ■</ThemedText>
      </View>

      {/* Main header */}
      <View style={styles.header}>
        {/* Left: branch + greeting */}
        <View style={styles.left}>
          <View style={styles.branchRow}>
            <View style={[styles.branchDot, { backgroundColor: branchColor }]} />
            <ThemedText type="label" style={[styles.branchLabel, { color: branchColor }]}>
              {branchLabel}
            </ThemedText>
          </View>
          <ThemedText type="label" style={styles.greetingText}>{greeting()},</ThemedText>
          <ThemedText style={styles.name} numberOfLines={1}>{displayName}</ThemedText>
        </View>

        {/* Right: date/time */}
        <View style={styles.right}>
          <ThemedText type="label" style={styles.clock}>{timeStr}</ThemedText>
          <ThemedText type="label" style={styles.date}>{dateStr}</ThemedText>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <ThemedText type="label" style={styles.statusText}>SECURE</ThemedText>
          </View>
        </View>
      </View>

      {/* Bottom rule */}
      <View style={styles.rule}>
        <View style={[styles.ruleLine, { backgroundColor: Brand.accent }]} />
        <View style={styles.ruleDiamond} />
        <View style={[styles.ruleLine, { backgroundColor: Brand.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#04080F',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  classBar: {
    backgroundColor: Brand.classified,
    paddingVertical: 3,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  left: { flex: 1, gap: 2 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginBottom: 2 },
  branchDot: { width: 6, height: 6, borderRadius: 3 },
  branchLabel: { fontSize: 9 },
  greetingText: { fontSize: 9, color: '#3D6080' },
  name: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#C8D8E8',
    fontFamily: undefined,
  },
  right: { alignItems: 'flex-end', gap: 3, paddingTop: 2 },
  clock: { fontSize: 16, color: Brand.tactical, letterSpacing: 1 },
  date: { fontSize: 9, color: '#3D6080' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Brand.success,
  },
  statusText: { fontSize: 9, color: Brand.success },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one + 2,
    gap: 4,
  },
  ruleLine: { flex: 1, height: 1, opacity: 0.6 },
  ruleDiamond: {
    width: 5,
    height: 5,
    backgroundColor: Brand.accent,
    transform: [{ rotate: '45deg' }],
  },
});
