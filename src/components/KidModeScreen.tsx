import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useKidModeStore } from '@/store/kid-mode.store';
import { useKidsStore } from '@/store/kids.store';
import { Chore, getKidTheme, KidProfile } from '@/types/kids.types';

// ── Kid-friendly money tips ─────────────────────────────────────────────────────

const MONEY_TIPS = [
  { icon: '🏦', title: 'Save First!', body: "Before you spend any money, put a little in savings. Even $1 a week adds up to $52 a year!" },
  { icon: '🎯', title: 'Set a Goal', body: "Know what you're saving for. Having a goal makes saving exciting — you can watch your progress every day!" },
  { icon: '💡', title: 'Needs vs. Wants', body: "A need is something you must have, like food or shoes. A want is something you'd like but can live without. Learn the difference!" },
  { icon: '⏰', title: 'Start Early', body: "The earlier you start saving, the more money you'll have later. Money you save today grows over time!" },
  { icon: '🧠', title: 'Think Before You Buy', body: "Before buying something, wait one day. If you still want it tomorrow, it might be worth it. If you forgot about it, you probably didn't need it!" },
  { icon: '🤝', title: 'Give Back', body: "Part of being great with money is sharing. Try setting aside a little to help someone who needs it more than you." },
];

// ── PIN Keypad ──────────────────────────────────────────────────────────────────

function PINKeypad({
  title,
  subtitle,
  onComplete,
  onCancel,
  accentColor,
}: {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  accentColor: string;
}) {
  const [digits, setDigits] = useState('');
  const [shake, setShake] = useState(false);

  const press = (d: string) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => onComplete(next), 100);
    }
  };

  const del = () => setDigits((d) => d.slice(0, -1));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', ''];

  return (
    <View style={pinStyles.container}>
      <ThemedText style={[pinStyles.title, { color: accentColor }]}>{title}</ThemedText>
      {subtitle ? <ThemedText style={pinStyles.subtitle}>{subtitle}</ThemedText> : null}

      <View style={pinStyles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              pinStyles.dot,
              { borderColor: accentColor },
              digits.length > i && { backgroundColor: accentColor },
            ]}
          />
        ))}
      </View>

      <View style={pinStyles.grid}>
        {keys.map((k, idx) => (
          <Pressable
            key={idx}
            onPress={() => {
              if (k === '⌫') del();
              else if (k !== '') press(k);
            }}
            style={({ pressed }) => [
              pinStyles.key,
              k === '' && { opacity: 0 },
              pressed && k !== '' && { opacity: 0.6, backgroundColor: accentColor + '20' },
            ]}>
            <ThemedText style={[pinStyles.keyText, k === '⌫' && { fontSize: 22 }]}>{k}</ThemedText>
          </Pressable>
        ))}
      </View>

      {onCancel && (
        <Pressable onPress={onCancel} style={pinStyles.cancelBtn}>
          <ThemedText style={[pinStyles.cancelText, { color: accentColor }]}>CANCEL</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const pinStyles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#6B92B0', textAlign: 'center', paddingHorizontal: Spacing.three },
  dots: { flexDirection: 'row', gap: 20, marginVertical: Spacing.three },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: 'transparent' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 240 },
  key: {
    width: 80,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  keyText: { fontSize: 26, fontWeight: '600', color: '#C8D8E8' },
  cancelBtn: { marginTop: Spacing.two, paddingVertical: Spacing.two, paddingHorizontal: Spacing.four },
  cancelText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});

// ── Exit PIN modal ──────────────────────────────────────────────────────────────

function ExitPINModal({
  visible,
  pin,
  accentColor,
  onSuccess,
  onCancel,
}: {
  visible: boolean;
  pin: string;
  accentColor: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');

  const handleComplete = (entered: string) => {
    if (entered === pin) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect PIN — try again');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={exitStyles.overlay}>
        <View style={[exitStyles.card, { borderColor: accentColor + '40' }]}>
          <ThemedText style={[exitStyles.heading, { color: accentColor }]}>PARENT ACCESS</ThemedText>
          <PINKeypad
            title="Enter Parent PIN"
            subtitle={error || undefined}
            onComplete={handleComplete}
            onCancel={onCancel}
            accentColor={accentColor}
          />
        </View>
      </View>
    </Modal>
  );
}

const exitStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  card: {
    backgroundColor: '#04080F',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  heading: { fontSize: 13, fontWeight: '900', letterSpacing: 2, marginTop: Spacing.two },
});

// ── Chore row ───────────────────────────────────────────────────────────────────

function ChoreRow({
  chore,
  kidId,
  firstGoalId,
  theme,
}: {
  chore: Chore;
  kidId: string;
  firstGoalId: string;
  theme: ReturnType<typeof getKidTheme>;
}) {
  const completeChore = useKidsStore((s) => s.completeChore);
  const uncompleteChore = useKidsStore((s) => s.uncompleteChore);

  const todayStr = new Date().toISOString().slice(0, 10);
  const done = chore.completedDates.includes(todayStr);

  const toggle = () => {
    if (done) {
      uncompleteChore(kidId, chore.id, firstGoalId || undefined);
    } else {
      completeChore(kidId, chore.id, firstGoalId);
    }
  };

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        choreStyles.row,
        { borderColor: done ? theme.primary + '60' : theme.primary + '20', backgroundColor: done ? theme.primary + '12' : theme.card },
        pressed && { opacity: 0.7 },
      ]}>
      <View style={[choreStyles.check, { borderColor: theme.primary }, done && { backgroundColor: theme.primary }]}>
        {done && <ThemedText style={choreStyles.checkMark}>✓</ThemedText>}
      </View>
      <ThemedText style={[choreStyles.name, done && { textDecorationLine: 'line-through', color: '#6B92B0' }]}>
        {chore.name}
      </ThemedText>
      <ThemedText style={[choreStyles.value, { color: done ? '#6B92B0' : theme.accent }]}>
        +${chore.value.toFixed(2)}
      </ThemedText>
    </Pressable>
  );
}

const choreStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.two + 2,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  name: { flex: 1, fontSize: 14, fontWeight: '600', color: '#C8D8E8' },
  value: { fontSize: 13, fontWeight: '800' },
});

// ── Goal progress card ──────────────────────────────────────────────────────────

function GoalCard({ goal, theme }: { goal: KidProfile['goals'][0]; theme: ReturnType<typeof getKidTheme> }) {
  const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
  const done = pct >= 1;

  return (
    <View style={[goalStyles.card, { backgroundColor: theme.card, borderColor: done ? theme.primary : theme.primary + '30' }]}>
      <ThemedText style={goalStyles.emoji}>{goal.emoji}</ThemedText>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ThemedText style={[goalStyles.name, { color: theme.accent }]}>{goal.name}</ThemedText>
          <ThemedText style={[goalStyles.pct, { color: done ? '#00B27A' : theme.primary }]}>
            {Math.round(pct * 100)}%{done ? ' ✓' : ''}
          </ThemedText>
        </View>
        <View style={[goalStyles.track, { backgroundColor: theme.primary + '20' }]}>
          <View style={[goalStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: done ? '#00B27A' : theme.primary }]} />
        </View>
        <ThemedText style={[goalStyles.amounts, { color: '#6B92B0' }]}>
          ${goal.currentAmount.toFixed(2)} saved of ${goal.targetAmount.toFixed(2)}
        </ThemedText>
      </View>
    </View>
  );
}

const goalStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, borderWidth: 1, borderRadius: 8, padding: Spacing.two + 2 },
  emoji: { fontSize: 26, lineHeight: 32, marginTop: 2 },
  name: { fontSize: 14, fontWeight: '800', flex: 1 },
  pct: { fontSize: 13, fontWeight: '800' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  amounts: { fontSize: 11 },
});

// ── Main kid mode screen ────────────────────────────────────────────────────────

export function KidModeScreen() {
  const deactivate = useKidModeStore((s) => s.deactivate);
  const pin = useKidModeStore((s) => s.pin);
  const kidId = useKidModeStore((s) => s.kidId);
  const kids = useKidsStore((s) => s.kids);
  const [showExit, setShowExit] = useState(false);
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * MONEY_TIPS.length));

  const kid = kids.find((k) => k.id === kidId);

  if (!kid) {
    return (
      <View style={[screen.container, { backgroundColor: '#04080F', alignItems: 'center', justifyContent: 'center' }]}>
        <ThemedText style={{ color: '#6B92B0', fontSize: 14 }}>Kid profile not found.</ThemedText>
        <Pressable onPress={deactivate} style={{ marginTop: 20 }}>
          <ThemedText style={{ color: '#00C8A8' }}>Back to Parent View</ThemedText>
        </Pressable>
      </View>
    );
  }

  const theme = getKidTheme(kid.gender);
  const todayStr = new Date().toISOString().slice(0, 10);
  const doneCount = kid.chores.filter((c) => c.completedDates.includes(todayStr)).length;
  const firstGoalId = kid.goals.find((g) => g.currentAmount < g.targetAmount)?.id ?? kid.goals[0]?.id ?? '';
  const tip = MONEY_TIPS[tipIdx];

  return (
    <View style={[screen.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={[screen.header, { borderBottomColor: theme.primary + '30' }]}>
          <View style={screen.headerLeft}>
            <ThemedText style={[screen.eyebrow, { color: theme.accent }]}>COMMAND CENTER</ThemedText>
            <ThemedText style={[screen.kidName, { color: theme.primary }]}>
              {kid.nickname.toUpperCase()}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => setShowExit(true)}
            style={[screen.lockBtn, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '40' }]}>
            <ThemedText style={[screen.lockIcon, { color: theme.primary }]}>🔒</ThemedText>
            <ThemedText style={[screen.lockLabel, { color: theme.primary }]}>PARENT</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={screen.content}
          showsVerticalScrollIndicator={false}>

          {/* Today's missions */}
          <View style={screen.section}>
            <View style={screen.sectionHeader}>
              <ThemedText style={[screen.sectionTitle, { color: theme.accent }]}>
                🎖️ TODAY'S MISSIONS
              </ThemedText>
              <ThemedText style={[screen.sectionBadge, { backgroundColor: theme.primary + '20', color: theme.primary }]}>
                {doneCount}/{kid.chores.length} DONE
              </ThemedText>
            </View>

            {kid.chores.length === 0 ? (
              <View style={[screen.emptyBox, { backgroundColor: theme.card, borderColor: theme.primary + '20' }]}>
                <ThemedText style={screen.emptyText}>No missions yet — ask your parent to add some!</ThemedText>
              </View>
            ) : (
              kid.chores.map((chore) => (
                <ChoreRow key={chore.id} chore={chore} kidId={kid.id} firstGoalId={firstGoalId} theme={theme} />
              ))
            )}
          </View>

          {/* Savings goals */}
          <View style={screen.section}>
            <ThemedText style={[screen.sectionTitle, { color: theme.accent }]}>🎯 SAVINGS GOALS</ThemedText>
            {kid.goals.length === 0 ? (
              <View style={[screen.emptyBox, { backgroundColor: theme.card, borderColor: theme.primary + '20' }]}>
                <ThemedText style={screen.emptyText}>No goals yet — ask your parent to set one up!</ThemedText>
              </View>
            ) : (
              kid.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} theme={theme} />
              ))
            )}
          </View>

          {/* Money smarts tip */}
          <View style={[screen.tipCard, { backgroundColor: theme.card, borderColor: theme.primary + '30' }]}>
            <View style={screen.tipHeader}>
              <ThemedText style={[screen.tipLabel, { color: theme.accent }]}>💰 MONEY INTEL</ThemedText>
              <View style={screen.tipNav}>
                <Pressable
                  onPress={() => setTipIdx((i) => (i - 1 + MONEY_TIPS.length) % MONEY_TIPS.length)}
                  hitSlop={10} style={screen.tipNavBtn}>
                  <ThemedText style={[screen.tipNavText, { color: theme.primary }]}>‹</ThemedText>
                </Pressable>
                <ThemedText style={[screen.tipCounter, { color: '#6B92B0' }]}>{tipIdx + 1}/{MONEY_TIPS.length}</ThemedText>
                <Pressable
                  onPress={() => setTipIdx((i) => (i + 1) % MONEY_TIPS.length)}
                  hitSlop={10} style={screen.tipNavBtn}>
                  <ThemedText style={[screen.tipNavText, { color: theme.primary }]}>›</ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={screen.tipBody}>
              <ThemedText style={screen.tipIcon}>{tip.icon}</ThemedText>
              <View style={{ flex: 1, gap: 4 }}>
                <ThemedText style={[screen.tipTitle, { color: theme.primary }]}>{tip.title}</ThemedText>
                <ThemedText style={screen.tipText}>{tip.body}</ThemedText>
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>

      {/* Exit PIN modal */}
      <ExitPINModal
        visible={showExit}
        pin={pin ?? ''}
        accentColor={theme.primary}
        onSuccess={() => { setShowExit(false); deactivate(); }}
        onCancel={() => setShowExit(false)}
      />
    </View>
  );
}

const screen = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  headerLeft: { gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  kidName: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
  },
  lockIcon: { fontSize: 14, lineHeight: 18 },
  lockLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 48 },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  sectionBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },

  emptyBox: { borderWidth: 1, borderRadius: 8, borderStyle: 'dashed', padding: Spacing.three, alignItems: 'center' },
  emptyText: { fontSize: 12, color: '#6B92B0', textAlign: 'center' },

  tipCard: { borderWidth: 1, borderRadius: 10, padding: Spacing.three, gap: Spacing.two },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tipNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipNavBtn: { padding: 4 },
  tipNavText: { fontSize: 20, fontWeight: '300' },
  tipCounter: { fontSize: 11 },
  tipBody: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  tipIcon: { fontSize: 28, lineHeight: 34, marginTop: 2 },
  tipTitle: { fontSize: 14, fontWeight: '900' },
  tipText: { fontSize: 12, lineHeight: 18, color: '#A0B8CC' },
});
