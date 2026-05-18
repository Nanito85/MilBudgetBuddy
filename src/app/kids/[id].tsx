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
import { getKidTheme } from '@/types/kids.types';
import { Spacing } from '@/constants/theme';

const GOAL_EMOJIS = ['🎮', '🚲', '👟', '📚', '🎸', '🏀', '🎨', '✈️', '🏄', '🐶', '🎃', '💎'];

function AddGoalModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (name: string, emoji: string, target: number) => void }) {
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

function AddChoreModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (name: string, value: number) => void }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');

  const submit = () => {
    const v = parseFloat(value);
    if (!name.trim() || isNaN(v) || v <= 0) return;
    onAdd(name.trim(), v);
    setName(''); setValue('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.modalHeader}>
          <ThemedText style={styles.modalTitle}>New Chore</ThemedText>
          <Pressable onPress={onClose}><ThemedText style={styles.modalClose}>Cancel</ThemedText></Pressable>
        </View>
        <TextInput placeholder="Chore name (e.g. Clean room)" value={name} onChangeText={setName} style={styles.textInput} />
        <TextInput placeholder="Value per completion ($)" value={value} onChangeText={setValue} keyboardType="decimal-pad" style={styles.textInput} />
        <Pressable onPress={submit} style={styles.addBtn}>
          <ThemedText style={styles.addBtnText}>Add Chore</ThemedText>
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

  const kid = kids.find((k) => k.id === id);
  if (!kid) return null;

  const theme = getKidTheme(kid.gender);
  const tip = getDailyKidsTip();

  const totalEarned = kid.chores.reduce((sum, c) => sum + c.completedDates.length * c.value, 0);

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

        {/* Chores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>⚡ DAILY MISSIONS</ThemedText>
            <Pressable onPress={() => setShowAddChore(true)} style={[styles.addPill, { borderColor: theme.accent }]}>
              <ThemedText style={[styles.addPillText, { color: theme.accent }]}>+ Add</ThemedText>
            </Pressable>
          </View>
          <ChoresList
            chores={kid.chores}
            goals={kid.goals}
            kidId={kid.id}
            accentColor={theme.accent}
            onComplete={(choreId, goalId) => completeChore(kid.id, choreId, goalId)}
            onUncomplete={(choreId) => uncompleteChore(kid.id, choreId)}
          />
        </View>

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
        onClose={() => setShowAddChore(false)}
        onAdd={(name, value) => addChore(kid.id, name, value)}
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
