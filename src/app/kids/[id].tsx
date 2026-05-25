import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { KIDS_TIPS, getDailyKidsTipIndex } from '@/data/kids-tips';
import { useKidsStore } from '@/store/kids.store';
import { ChoreFrequency, Goal, getKidTheme } from '@/types/kids.types';
import { Spacing } from '@/constants/theme';

const GOAL_EMOJIS = [
  '🎮','🚲','👟','📚','🎸','🏀','🎨','✈️','🏄','🐶',
  '🎃','💎','🍕','🎯','🦄','🌈','🏆','🎁','🎠','🎡',
  '🎪','🧸','🎀','🎵','⚽','🏊','🚀','🌟','🦋','🐬',
  '🎤','🎧','📱','💻','🎻','🛹','🏋️','🎳','🤿','🪄',
];

const FREQ_OPTIONS: { key: ChoreFrequency; label: string; emoji: string }[] = [
  { key: 'daily',   label: 'Daily',   emoji: '⚡' },
  { key: 'weekly',  label: 'Weekly',  emoji: '📅' },
  { key: 'monthly', label: 'Monthly', emoji: '🗓️' },
];

// ── Add Goal Modal ─────────────────────────────────────────────────────────────

function AddGoalModal({ visible, accentColor, onClose, onAdd }: {
  visible: boolean;
  accentColor: string;
  onClose: () => void;
  onAdd: (name: string, emoji: string, target: number) => void;
}) {
  const [name, setName]     = useState('');
  const [target, setTarget] = useState('');
  const [emoji, setEmoji]   = useState('🎮');

  const submit = () => {
    const t = parseFloat(target);
    if (!name.trim() || isNaN(t) || t <= 0) return;
    onAdd(name.trim(), emoji, t);
    setName(''); setTarget(''); setEmoji('🎮');
    Keyboard.dismiss();
    onClose();
  };

  const isValid = name.trim().length > 0 && parseFloat(target) > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={[addGoalStyles.container, { borderTopColor: accentColor }]}>
          {/* Header */}
          <View style={addGoalStyles.header}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }} style={addGoalStyles.cancelBtn}>
              <ThemedText style={addGoalStyles.cancelText}>✕</ThemedText>
            </Pressable>
            <ThemedText style={[addGoalStyles.title, { color: accentColor }]}>🎯 NEW GOAL</ThemedText>
            <Pressable
              onPress={submit}
              disabled={!isValid}
              style={[addGoalStyles.saveBtn, { backgroundColor: accentColor }, !isValid && { opacity: 0.4 }]}>
              <ThemedText style={addGoalStyles.saveBtnText}>ADD</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={addGoalStyles.scroll}>

            {/* Emoji picker */}
            <ThemedText style={addGoalStyles.fieldLabel}>PICK AN EMOJI</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={addGoalStyles.emojiScroll}>
              {GOAL_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    addGoalStyles.emojiBtn,
                    emoji === e && { backgroundColor: accentColor + '30', borderColor: accentColor, borderWidth: 2 },
                  ]}>
                  <ThemedText style={addGoalStyles.emojiChar}>{e}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
            <ThemedText style={[addGoalStyles.selectedEmoji]}>{emoji}</ThemedText>

            {/* Goal name */}
            <ThemedText style={addGoalStyles.fieldLabel}>WHAT'S YOUR GOAL?</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Type your goal here (e.g. New Bike, PS5, Shoes...)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={addGoalStyles.input}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>

            {/* Goal cost */}
            <ThemedText style={addGoalStyles.fieldLabel}>HOW MUCH DOES IT COST?</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <ThemedText style={addGoalStyles.dollarSign}>$</ThemedText>
              <TextInput
                value={target}
                onChangeText={setTarget}
                placeholder="Goal cost (e.g. 299.99)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                style={[addGoalStyles.input, { flex: 1 }]}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            </View>

            {/* Preview */}
            {name.trim().length > 0 && (
              <View style={[addGoalStyles.preview, { borderColor: accentColor + '40', backgroundColor: accentColor + '10' }]}>
                <ThemedText style={addGoalStyles.previewEmoji}>{emoji}</ThemedText>
                <View style={{ flex: 1, gap: 3 }}>
                  <ThemedText style={[addGoalStyles.previewName, { color: accentColor }]}>{name}</ThemedText>
                  <ThemedText style={addGoalStyles.previewAmt}>
                    Goal: {target ? `$${parseFloat(target).toFixed(2)}` : '$—'}
                  </ThemedText>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const addGoalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
    borderTopWidth: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  saveBtn: { borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 8 },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },

  fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },

  emojiScroll: { paddingVertical: Spacing.one, gap: Spacing.one },
  emojiBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emojiChar: { fontSize: 26, lineHeight: 32 },
  selectedEmoji: { fontSize: 48, textAlign: 'center', lineHeight: 56 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: 4,
  },
  dollarSign: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  input: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    padding: 0,
  },

  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.three,
  },
  previewEmoji: { fontSize: 36, lineHeight: 44 },
  previewName:  { fontSize: 16, fontWeight: '800' },
  previewAmt:   { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
});

// ── Edit Goal Modal ────────────────────────────────────────────────────────────

function EditGoalModal({ visible, goal, accentColor, onClose, onSave, onDelete }: {
  visible: boolean;
  goal: Goal | null;
  accentColor: string;
  onClose: () => void;
  onSave: (id: string, name: string, emoji: string, target: number, current: number) => void;
  onDelete: (id: string) => void;
}) {
  const [name, setName]     = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal?.targetAmount?.toString() ?? '');
  const [current, setCurrent] = useState(goal?.currentAmount?.toString() ?? '');
  const [emoji, setEmoji]   = useState(goal?.emoji ?? '🎮');

  // Sync state when goal changes
  React.useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTarget(goal.targetAmount.toString());
      setCurrent(goal.currentAmount.toString());
      setEmoji(goal.emoji);
    }
  }, [goal?.id]);

  if (!goal) return null;

  const submit = () => {
    const t = parseFloat(target);
    const c = parseFloat(current);
    if (!name.trim() || isNaN(t) || t <= 0) return;
    onSave(goal.id, name.trim(), emoji, t, isNaN(c) ? goal.currentAmount : c);
    Keyboard.dismiss();
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Delete Goal', `Remove "${goal.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(goal.id); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={[addGoalStyles.container, { borderTopColor: accentColor }]}>
          <View style={addGoalStyles.header}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }} style={addGoalStyles.cancelBtn}>
              <ThemedText style={addGoalStyles.cancelText}>✕</ThemedText>
            </Pressable>
            <ThemedText style={[addGoalStyles.title, { color: accentColor }]}>✏️ EDIT GOAL</ThemedText>
            <Pressable onPress={submit} style={[addGoalStyles.saveBtn, { backgroundColor: accentColor }]}>
              <ThemedText style={addGoalStyles.saveBtnText}>SAVE</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={addGoalStyles.scroll}>

            <ThemedText style={addGoalStyles.fieldLabel}>PICK AN EMOJI</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={addGoalStyles.emojiScroll}>
              {GOAL_EMOJIS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setEmoji(e)}
                  style={[
                    addGoalStyles.emojiBtn,
                    emoji === e && { backgroundColor: accentColor + '30', borderColor: accentColor, borderWidth: 2 },
                  ]}>
                  <ThemedText style={addGoalStyles.emojiChar}>{e}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
            <ThemedText style={addGoalStyles.selectedEmoji}>{emoji}</ThemedText>

            <ThemedText style={addGoalStyles.fieldLabel}>GOAL NAME</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Goal name (e.g. New Bike)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={addGoalStyles.input}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>

            <ThemedText style={addGoalStyles.fieldLabel}>GOAL COST</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <ThemedText style={addGoalStyles.dollarSign}>$</ThemedText>
              <TextInput
                value={target}
                onChangeText={setTarget}
                placeholder="Total cost (e.g. 299.99)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                style={[addGoalStyles.input, { flex: 1 }]}
                returnKeyType="next"
              />
            </View>

            <ThemedText style={addGoalStyles.fieldLabel}>AMOUNT SAVED SO FAR</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <ThemedText style={addGoalStyles.dollarSign}>$</ThemedText>
              <TextInput
                value={current}
                onChangeText={setCurrent}
                placeholder="Current savings (e.g. 50.00)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                style={[addGoalStyles.input, { flex: 1 }]}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            </View>

            <Pressable onPress={handleDelete} style={editGoalStyles.deleteBtn}>
              <ThemedText style={editGoalStyles.deleteBtnText}>🗑️  DELETE THIS GOAL</ThemedText>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const editGoalStyles = StyleSheet.create({
  deleteBtn: {
    borderWidth: 1,
    borderColor: 'rgba(220,50,50,0.4)',
    borderRadius: 12,
    padding: Spacing.two + 4,
    alignItems: 'center',
    backgroundColor: 'rgba(220,50,50,0.08)',
    marginTop: Spacing.two,
  },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#FF6B6B', letterSpacing: 0.5 },
});

// ── Add Chore Modal ────────────────────────────────────────────────────────────

function AddChoreModal({ visible, defaultFrequency, accentColor, onClose, onAdd }: {
  visible: boolean;
  defaultFrequency: ChoreFrequency;
  accentColor: string;
  onClose: () => void;
  onAdd: (name: string, value: number, frequency: ChoreFrequency) => void;
}) {
  const [name, setName]         = useState('');
  const [value, setValue]       = useState('');
  const [frequency, setFrequency] = useState<ChoreFrequency>(defaultFrequency);

  const submit = () => {
    const v = parseFloat(value);
    if (!name.trim() || isNaN(v) || v <= 0) return;
    onAdd(name.trim(), v, frequency);
    setName(''); setValue('');
    Keyboard.dismiss();
    onClose();
  };

  const isValid = name.trim().length > 0 && parseFloat(value) > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={[addGoalStyles.container, { borderTopColor: accentColor }]}>
          <View style={addGoalStyles.header}>
            <Pressable onPress={() => { Keyboard.dismiss(); onClose(); }} style={addGoalStyles.cancelBtn}>
              <ThemedText style={addGoalStyles.cancelText}>✕</ThemedText>
            </Pressable>
            <ThemedText style={[addGoalStyles.title, { color: accentColor }]}>⚡ NEW MISSION</ThemedText>
            <Pressable
              onPress={submit}
              disabled={!isValid}
              style={[addGoalStyles.saveBtn, { backgroundColor: accentColor }, !isValid && { opacity: 0.4 }]}>
              <ThemedText style={addGoalStyles.saveBtnText}>ADD</ThemedText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={addGoalStyles.scroll}>

            <ThemedText style={addGoalStyles.fieldLabel}>FREQUENCY</ThemedText>
            <View style={choreStyles.freqRow}>
              {FREQ_OPTIONS.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFrequency(f.key)}
                  style={[
                    choreStyles.freqBtn,
                    frequency === f.key && { borderColor: accentColor, backgroundColor: accentColor + '20' },
                  ]}>
                  <ThemedText style={choreStyles.freqEmoji}>{f.emoji}</ThemedText>
                  <ThemedText style={[choreStyles.freqLabel, frequency === f.key && { color: accentColor }]}>
                    {f.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <ThemedText style={addGoalStyles.fieldLabel}>MISSION NAME</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Mission name (e.g. Clean Room, Feed Dog...)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={addGoalStyles.input}
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>

            <ThemedText style={addGoalStyles.fieldLabel}>REWARD AMOUNT</ThemedText>
            <View style={addGoalStyles.inputWrap}>
              <ThemedText style={addGoalStyles.dollarSign}>$</ThemedText>
              <TextInput
                value={value}
                onChangeText={setValue}
                placeholder="Reward per completion (e.g. 2.50)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                style={[addGoalStyles.input, { flex: 1 }]}
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const choreStyles = StyleSheet.create({
  freqRow: { flexDirection: 'row', gap: Spacing.two },
  freqBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.two + 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, gap: 4,
  },
  freqEmoji: { fontSize: 22, lineHeight: 28 },
  freqLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
});

// ── Main Kid Screen ────────────────────────────────────────────────────────────

export default function KidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const kids         = useKidsStore((s) => s.kids);
  const completeChore   = useKidsStore((s) => s.completeChore);
  const uncompleteChore = useKidsStore((s) => s.uncompleteChore);
  const addGoal      = useKidsStore((s) => s.addGoal);
  const updateGoal   = useKidsStore((s) => s.updateGoal);
  const removeGoal   = useKidsStore((s) => s.removeGoal);
  const addChore     = useKidsStore((s) => s.addChore);

  const [showAddGoal, setShowAddGoal]   = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editingGoal, setEditingGoal]   = useState<Goal | null>(null);
  const [showAddChore, setShowAddChore] = useState(false);
  const [addChoreFreq, setAddChoreFreq] = useState<ChoreFrequency>('daily');

  const [briefIdx, setBriefIdx] = useState(() => getDailyKidsTipIndex());

  const kid = kids.find((k) => k.id === id);
  if (!kid) return null;

  const theme = getKidTheme(kid.gender);
  const tip   = KIDS_TIPS[briefIdx];

  const totalEarned = kid.chores.reduce((sum, c) => sum + c.completedDates.length * c.value, 0);

  const dailyChores   = kid.chores.filter((c) => (c.frequency ?? 'daily') === 'daily');
  const weeklyChores  = kid.chores.filter((c) => c.frequency === 'weekly');
  const monthlyChores = kid.chores.filter((c) => c.frequency === 'monthly');

  const historyEntries = kid.chores
    .flatMap((c) => c.completedDates.map((d) => ({ name: c.name, date: d, value: c.value })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  const openAddChore = (freq: ChoreFrequency) => { setAddChoreFreq(freq); setShowAddChore(true); };

  const openEditGoal = (goal: Goal) => { setEditingGoal(goal); setShowEditGoal(true); };

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/profile')} style={styles.backBtn}>
            <ThemedText style={[styles.backText, { color: theme.accentLight }]}>‹ Back</ThemedText>
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerBadge, { backgroundColor: theme.primary + '30' }]}>
              <ThemedText style={[styles.rankLabel, { color: theme.accentLight }]}>{theme.label}</ThemedText>
            </View>
            <ThemedText style={styles.nickname}>{kid.nickname.toUpperCase()}</ThemedText>
          </View>
          <View style={[styles.earnedBadge, { backgroundColor: theme.card }]}>
            <ThemedText style={[styles.earnedAmt, { color: theme.badge }]}>${totalEarned.toFixed(2)}</ThemedText>
            <ThemedText style={styles.earnedLabel}>EARNED</ThemedText>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Goals section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.accentLight }]}>🎯 MISSION GOALS</ThemedText>
            <Pressable
              onPress={() => setShowAddGoal(true)}
              style={[styles.addPill, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add Goal</ThemedText>
            </Pressable>
          </View>

          {kid.goals.length === 0 ? (
            <Pressable onPress={() => setShowAddGoal(true)} style={[styles.emptyCard, { borderColor: theme.accent + '60' }]}>
              <ThemedText style={styles.emptyCardEmoji}>🌟</ThemedText>
              <ThemedText style={[styles.emptyCardTitle, { color: theme.accent }]}>No goals yet!</ThemedText>
              <ThemedText style={styles.emptyCardSub}>Tap to set your first savings goal.</ThemedText>
            </Pressable>
          ) : (
            <View style={styles.goalsContainer}>
              {kid.goals.map((g) => (
                <Pressable
                  key={g.id}
                  onPress={() => openEditGoal(g)}
                  style={({ pressed }) => [
                    styles.goalCard,
                    { backgroundColor: theme.card, borderColor: theme.accent + '30' },
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}>
                  <GoalMeter goal={g} accentColor={theme.accent} />
                  <ThemedText style={[styles.goalEditHint, { color: theme.accent + '80' }]}>
                    Tap to edit ✏️
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── Daily Missions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.accentLight }]}>⚡ DAILY MISSIONS</ThemedText>
            <Pressable onPress={() => openAddChore('daily')} style={[styles.addPill, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
            </Pressable>
          </View>
          <ChoresList
            chores={dailyChores}
            goals={kid.goals}
            kidId={kid.id}
            accentColor={theme.accent}
            onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
            onUncomplete={(choreId, goalId) => uncompleteChore(kid.id, choreId, goalId)}
          />
        </View>

        {/* ── Weekly Missions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.accentLight }]}>📅 WEEKLY MISSIONS</ThemedText>
            <Pressable onPress={() => openAddChore('weekly')} style={[styles.addPill, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
            </Pressable>
          </View>
          {weeklyChores.length > 0 ? (
            <ChoresList
              chores={weeklyChores}
              goals={kid.goals}
              kidId={kid.id}
              accentColor={theme.accent}
              onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
              onUncomplete={(choreId, goalId) => uncompleteChore(kid.id, choreId, goalId)}
            />
          ) : (
            <Pressable onPress={() => openAddChore('weekly')} style={[styles.freqEmptyRow, { borderColor: theme.accent + '40' }]}>
              <ThemedText style={styles.freqEmptyIcon}>📅</ThemedText>
              <ThemedText style={styles.freqEmptyText}>Add a weekly mission</ThemedText>
              <ThemedText style={[styles.freqEmptyPlus, { color: theme.accent }]}>+</ThemedText>
            </Pressable>
          )}
        </View>

        {/* ── Monthly Missions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.accentLight }]}>🗓️ MONTHLY MISSIONS</ThemedText>
            <Pressable onPress={() => openAddChore('monthly')} style={[styles.addPill, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
            </Pressable>
          </View>
          {monthlyChores.length > 0 ? (
            <ChoresList
              chores={monthlyChores}
              goals={kid.goals}
              kidId={kid.id}
              accentColor={theme.accent}
              onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
              onUncomplete={(choreId, goalId) => uncompleteChore(kid.id, choreId, goalId)}
            />
          ) : (
            <Pressable onPress={() => openAddChore('monthly')} style={[styles.freqEmptyRow, { borderColor: theme.accent + '40' }]}>
              <ThemedText style={styles.freqEmptyIcon}>🗓️</ThemedText>
              <ThemedText style={styles.freqEmptyText}>Add a monthly mission</ThemedText>
              <ThemedText style={[styles.freqEmptyPlus, { color: theme.accent }]}>+</ThemedText>
            </Pressable>
          )}
        </View>

        {/* ── Completed History ── */}
        {historyEntries.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.accentLight }]}>📋 COMPLETED HISTORY</ThemedText>
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

        {/* ── Junior Intel Brief ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.accentLight }]}>🎓 JUNIOR INTEL BRIEF</ThemedText>
            <View style={[styles.briefNav, { borderColor: theme.accent + '40' }]}>
              <Pressable
                onPress={() => setBriefIdx((i) => (i - 1 + KIDS_TIPS.length) % KIDS_TIPS.length)}
                hitSlop={10}>
                <ThemedText style={[styles.briefArrow, { color: theme.accent }]}>‹</ThemedText>
              </Pressable>
              <ThemedText style={styles.briefCounter}>{briefIdx + 1}/{KIDS_TIPS.length}</ThemedText>
              <Pressable
                onPress={() => setBriefIdx((i) => (i + 1) % KIDS_TIPS.length)}
                hitSlop={10}>
                <ThemedText style={[styles.briefArrow, { color: theme.accent }]}>›</ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.accent + '30' }]}>
            <ThemedText style={styles.tipEmoji}>{tip.emoji}</ThemedText>
            <View style={styles.tipBody}>
              <ThemedText style={[styles.tipTitle, { color: theme.badge }]}>{tip.title}</ThemedText>
              <ThemedText style={styles.tipText}>{tip.body}</ThemedText>
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.six }} />
      </ScrollView>

      <AddGoalModal
        visible={showAddGoal}
        accentColor={theme.accent}
        onClose={() => setShowAddGoal(false)}
        onAdd={(name, emoji, target) => addGoal(kid.id, name, emoji, target)}
      />

      <EditGoalModal
        visible={showEditGoal}
        goal={editingGoal}
        accentColor={theme.accent}
        onClose={() => { setShowEditGoal(false); setEditingGoal(null); }}
        onSave={(goalId, name, emoji, target, current) =>
          updateGoal(kid.id, goalId, name, emoji, target, current)
        }
        onDelete={(goalId) => removeGoal(kid.id, goalId)}
      />

      <AddChoreModal
        visible={showAddChore}
        defaultFrequency={addChoreFreq}
        accentColor={theme.accent}
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
    paddingVertical: Spacing.two + 4,
    gap: Spacing.two,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 17, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  rankLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  nickname: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#FFFFFF' },
  earnedBadge: { width: 70, alignItems: 'center', borderRadius: 12, padding: Spacing.one + 2 },
  earnedAmt:   { fontSize: 15, fontWeight: '900' },
  earnedLabel: { fontSize: 8, letterSpacing: 1.5, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.four, paddingTop: Spacing.two },

  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:  { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },

  addPill: {
    borderWidth: 1.5, borderRadius: 16,
    paddingHorizontal: Spacing.two + 2, paddingVertical: 5,
  },
  addPillText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  goalsContainer: { gap: Spacing.two },
  goalCard: {
    borderRadius: 18, padding: Spacing.three, gap: Spacing.one,
    borderWidth: 1.5,
  },
  goalEditHint: { fontSize: 10, fontWeight: '600', textAlign: 'right', letterSpacing: 0.5 },

  emptyCard: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 20,
    padding: Spacing.four, alignItems: 'center', gap: Spacing.one,
  },
  emptyCardEmoji: { fontSize: 40, lineHeight: 48 },
  emptyCardTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  emptyCardSub:   { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' },

  freqEmptyRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderStyle: 'dashed', borderRadius: 14,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2, gap: Spacing.two,
  },
  freqEmptyIcon: { fontSize: 18 },
  freqEmptyText: { flex: 1, color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  freqEmptyPlus: { fontSize: 20, fontWeight: '700' },

  historyCard: { borderRadius: 14, overflow: 'hidden' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.two,
  },
  historyRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  historyDate:  { fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', width: 78 },
  historyName:  { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  historyValue: { fontSize: 13, fontWeight: '700' },

  briefNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.one + 2, paddingVertical: 2 },
  briefArrow: { fontSize: 20, fontWeight: '300', lineHeight: 26 },
  briefCounter: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', minWidth: 28, textAlign: 'center' },

  tipCard: {
    borderRadius: 18, padding: Spacing.three, flexDirection: 'row',
    gap: Spacing.two, alignItems: 'flex-start',
    borderWidth: 1,
  },
  tipEmoji: { fontSize: 30, lineHeight: 36 },
  tipBody:  { flex: 1, gap: Spacing.one },
  tipTitle: { fontSize: 14, fontWeight: '900' },
  tipText:  { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.75)' },
});
