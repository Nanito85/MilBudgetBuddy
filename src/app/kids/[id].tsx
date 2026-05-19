import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ChoresList } from '@/features/kids/components/ChoresList';
import { GoalMeter } from '@/features/kids/components/GoalMeter';
import { getDailyKidsTip } from '@/data/kids-tips';
import { useKidsStore } from '@/store/kids.store';
import { ChoreFrequency, getKidTheme } from '@/types/kids.types';
import { Spacing } from '@/constants/theme';

const GOAL_EMOJIS = ['🎮', '🚲', '👟', '📚', '🎸', '🏀', '🎨', '✈️', '🏄', '🐶', '🎃', '💎'];

const FREQ_OPTIONS: { key: ChoreFrequency; label: string; emoji: string }[] = [
  { key: 'daily',   label: 'Daily',   emoji: '⚡' },
  { key: 'weekly',  label: 'Weekly',  emoji: '📅' },
  { key: 'monthly', label: 'Monthly', emoji: '🗓️' },
];

function AddGoalModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string, emoji: string, target: number) => void;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji] = useState('🎮');

  const submit = () => {
    const t = parseFloat(target);
    if (!name.trim() || isNaN(t) || t <= 0) return;
    onAdd(name.trim(), emoji, t);
    setName(''); setTarget(''); setEmoji('🎮');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>New Goal</ThemedText>
          <Pressable onPress={onClose}><ThemedText style={styles.modalClose}>Cancel</ThemedText></Pressable>
        </View>
        <View style={styles.emojiRow}>
          {GOAL_EMOJIS.map((e) => (
            <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]}>
              <ThemedText style={styles.emojiChar}>{e}</ThemedText>
            </Pressable>
          ))}
        </View>
        <TextInput placeholder="Goal name (e.g. PS5, New Bike)" value={name} onChangeText={setName} style={styles.textInput} />
        <TextInput placeholder="Target amount ($)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" style={styles.textInput} />
        <Pressable onPress={submit} style={styles.addBtn}>
          <ThemedText style={styles.addBtnText}>Add Goal</ThemedText>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

function AddChoreModal({ visible, defaultFrequency, onClose, onAdd }: {
  visible: boolean;
  defaultFrequency: ChoreFrequency;
  onClose: () => void;
  onAdd: (name: string, value: number, frequency: ChoreFrequency) => void;
}) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [frequency, setFrequency] = useState<ChoreFrequency>(defaultFrequency);

  const submit = () => {
    const v = parseFloat(value);
    if (!name.trim() || isNaN(v) || v <= 0) return;
    onAdd(name.trim(), v, frequency);
    setName(''); setValue('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>New Mission</ThemedText>
          <Pressable onPress={onClose}><ThemedText style={styles.modalClose}>Cancel</ThemedText></Pressable>
        </View>
        <ThemedText style={styles.modalLabel}>FREQUENCY</ThemedText>
        <View style={styles.freqRow}>
          {FREQ_OPTIONS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFrequency(f.key)}
              style={[styles.freqBtn, frequency === f.key && styles.freqBtnActive]}>
              <ThemedText style={styles.freqEmoji}>{f.emoji}</ThemedText>
              <ThemedText style={[styles.freqLabel, frequency === f.key && styles.freqLabelActive]}>{f.label}</ThemedText>
            </Pressable>
          ))}
        </View>
        <TextInput
          placeholder="Mission name (e.g. Clean room)"
          value={name}
          onChangeText={setName}
          style={styles.textInput}
        />
        <TextInput
          placeholder="Value per completion ($)"
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          style={styles.textInput}
        />
        <Pressable onPress={submit} style={styles.addBtn}>
          <ThemedText style={styles.addBtnText}>Add Mission</ThemedText>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

export default function KidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const kids = useKidsStore((s) => s.kids);
  const completeChore = useKidsStore((s) => s.completeChore);
  const uncompleteChore = useKidsStore((s) => s.uncompleteChore);
  const addGoal = useKidsStore((s) => s.addGoal);
  const addChore = useKidsStore((s) => s.addChore);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddChore, setShowAddChore] = useState(false);
  const [addChoreFreq, setAddChoreFreq] = useState<ChoreFrequency>('daily');

  const kid = kids.find((k) => k.id === id);
  if (!kid) return null;

  const theme = getKidTheme(kid.gender);
  const tip = getDailyKidsTip();

  const totalEarned = kid.chores.reduce((sum, c) => sum + c.completedDates.length * c.value, 0);

  const dailyChores   = kid.chores.filter((c) => (c.frequency ?? 'daily') === 'daily');
  const weeklyChores  = kid.chores.filter((c) => c.frequency === 'weekly');
  const monthlyChores = kid.chores.filter((c) => c.frequency === 'monthly');

  // History: last 15 completions across all chores, newest first
  const historyEntries = kid.chores
    .flatMap((c) => c.completedDates.map((d) => ({ name: c.name, date: d, value: c.value })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  const openAddChore = (freq: ChoreFrequency) => {
    setAddChoreFreq(freq);
    setShowAddChore(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/profile')} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { color: theme.accentLight }]}>‹ Back</ThemedText>
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText style={styles.rankLabel}>{theme.label}</ThemedText>
            <ThemedText style={[styles.nickname, { color: '#FFFFFF' }]}>{kid.nickname.toUpperCase()}</ThemedText>
          </View>
          <View style={styles.earnedBadge}>
            <ThemedText style={[styles.earnedAmt, { color: theme.badge }]}>${totalEarned.toFixed(2)}</ThemedText>
            <ThemedText style={styles.earnedLabel}>earned</ThemedText>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>🎯 MISSION GOALS</ThemedText>
            <Pressable onPress={() => setShowAddGoal(true)} style={[styles.addPill, { borderColor: theme.accent }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
            </Pressable>
          </View>
          {kid.goals.length === 0 ? (
            <Pressable onPress={() => setShowAddGoal(true)} style={[styles.emptyCard, { borderColor: theme.accent }]}>
              <ThemedText style={styles.emptyCardText}>Tap to set your first goal!</ThemedText>
            </Pressable>
          ) : (
            <View style={styles.goalsContainer}>
              {kid.goals.map((g) => (
                <View key={g.id} style={[styles.goalCard, { backgroundColor: theme.card }]}>
                  <GoalMeter goal={g} accentColor={theme.accent} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Daily Missions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>⚡ DAILY MISSIONS</ThemedText>
            <Pressable onPress={() => openAddChore('daily')} style={[styles.addPill, { borderColor: theme.accent }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
            </Pressable>
          </View>
          <ChoresList
            chores={dailyChores}
            goals={kid.goals}
            kidId={kid.id}
            accentColor={theme.accent}
            onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
            onUncomplete={(choreId) => uncompleteChore(kid.id, choreId)}
          />
        </View>

        {/* Weekly Missions */}
        {(weeklyChores.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>📅 WEEKLY MISSIONS</ThemedText>
              <Pressable onPress={() => openAddChore('weekly')} style={[styles.addPill, { borderColor: theme.accent }]}>
                <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
              </Pressable>
            </View>
            <ChoresList
              chores={weeklyChores}
              goals={kid.goals}
              kidId={kid.id}
              accentColor={theme.accent}
              onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
              onUncomplete={(choreId) => uncompleteChore(kid.id, choreId)}
            />
          </View>
        )}
        {weeklyChores.length === 0 && (
          <Pressable onPress={() => openAddChore('weekly')} style={[styles.freqEmptyRow, { borderColor: theme.accent + '40' }]}>
            <ThemedText style={styles.freqEmptyIcon}>📅</ThemedText>
            <ThemedText style={styles.freqEmptyText}>Add a weekly mission</ThemedText>
            <ThemedText style={[styles.freqEmptyPlus, { color: theme.accent }]}>+</ThemedText>
          </Pressable>
        )}

        {/* Monthly Missions */}
        {(monthlyChores.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>🗓️ MONTHLY MISSIONS</ThemedText>
              <Pressable onPress={() => openAddChore('monthly')} style={[styles.addPill, { borderColor: theme.accent }]}>
                <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
              </Pressable>
            </View>
            <ChoresList
              chores={monthlyChores}
              goals={kid.goals}
              kidId={kid.id}
              accentColor={theme.accent}
              onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
              onUncomplete={(choreId) => uncompleteChore(kid.id, choreId)}
            />
          </View>
        )}
        {monthlyChores.length === 0 && (
          <Pressable onPress={() => openAddChore('monthly')} style={[styles.freqEmptyRow, { borderColor: theme.accent + '40' }]}>
            <ThemedText style={styles.freqEmptyIcon}>🗓️</ThemedText>
            <ThemedText style={styles.freqEmptyText}>Add a monthly mission</ThemedText>
            <ThemedText style={[styles.freqEmptyPlus, { color: theme.accent }]}>+</ThemedText>
          </Pressable>
        )}

        {/* Completed History */}
        {historyEntries.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>📋 COMPLETED HISTORY</ThemedText>
            <View style={[styles.historyCard, { backgroundColor: theme.card }]}>
              {historyEntries.map((entry, i) => (
                <View key={`${entry.name}-${entry.date}-${i}`} style={[styles.historyRow, i > 0 && styles.historyRowBorder]}>
                  <ThemedText style={styles.historyDate}>{entry.date}</ThemedText>
                  <ThemedText style={styles.historyName}>{entry.name}</ThemedText>
                  <ThemedText style={[styles.historyValue, { color: theme.badge }]}>+${entry.value.toFixed(2)}</ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Finance Tip */}
        <View style={[styles.tipCard, { backgroundColor: theme.card }]}>
          <ThemedText style={styles.tipEmoji}>{tip.emoji}</ThemedText>
          <View style={styles.tipBody}>
            <ThemedText style={[styles.tipTitle, { color: theme.badge }]}>{tip.title}</ThemedText>
            <ThemedText style={styles.tipText}>{tip.body}</ThemedText>
          </View>
        </View>

        <View style={{ height: Spacing.six }} />
      </ScrollView>

      <AddGoalModal
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onAdd={(name, emoji, target) => addGoal(kid.id, name, emoji, target)}
      />
      <AddChoreModal
        visible={showAddChore}
        defaultFrequency={addChoreFreq}
        onClose={() => setShowAddChore(false)}
        onAdd={(name, value, frequency) => addChore(kid.id, name, value, frequency)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  rankLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  nickname: { fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  earnedBadge: { width: 60, alignItems: 'flex-end' },
  earnedAmt: { fontSize: 16, fontWeight: '800' },
  earnedLabel: { fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.four },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)' },
  addPill: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
  },
  addPillText: { fontSize: 12, fontWeight: '700' },
  goalsContainer: { gap: Spacing.two },
  goalCard: { borderRadius: Spacing.two, padding: Spacing.three },
  emptyCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Spacing.two,
    padding: Spacing.four,
    alignItems: 'center',
  },
  emptyCardText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  freqEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  freqEmptyIcon: { fontSize: 16 },
  freqEmptyText: { flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  freqEmptyPlus: { fontSize: 20, fontWeight: '700' },
  historyCard: { borderRadius: Spacing.two, overflow: 'hidden' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  historyRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  historyDate: { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', width: 78 },
  historyName: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  historyValue: { fontSize: 13, fontWeight: '700' },
  tipCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.two,
  },
  tipEmoji: { fontSize: 28 },
  tipBody: { flex: 1, gap: Spacing.one },
  tipTitle: { fontSize: 14, fontWeight: '800' },
  tipText: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.75)' },
  // Modal styles
  modal: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalClose: { fontSize: 16, color: '#2E5FA3' },
  modalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: 'rgba(128,128,128,0.8)', marginBottom: -Spacing.one },
  freqRow: { flexDirection: 'row', gap: Spacing.two },
  freqBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.2)',
    borderRadius: Spacing.two,
    gap: 4,
  },
  freqBtnActive: { borderColor: '#1B3A6B', backgroundColor: '#1B3A6B30' },
  freqEmoji: { fontSize: 20 },
  freqLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(128,128,128,0.7)' },
  freqLabelActive: { color: '#6BA3D6' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  emojiBtnActive: { backgroundColor: '#1B3A6B' },
  emojiChar: { fontSize: 22 },
  textInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#1B3A6B',
    borderRadius: Spacing.two,
    padding: Spacing.two + 6,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
