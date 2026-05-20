import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useEntitlement } from '@/hooks/use-entitlement';
import { useKidModeStore } from '@/store/kid-mode.store';
import { useKidsStore } from '@/store/kids.store';
import { KidGender, KidProfile, getKidTheme } from '@/types/kids.types';

// ── Add Kid Modal ──────────────────────────────────────────────────────────────

function AddKidModal({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (nickname: string, gender: KidGender) => void;
}) {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState<KidGender>('boy');

  const submit = () => {
    if (!nickname.trim()) return;
    onAdd(nickname.trim(), gender);
    setNickname('');
    setGender('boy');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={modalStyles.bg}>
        <SafeAreaView style={modalStyles.safe}>
          <View style={modalStyles.header}>
            <ThemedText style={modalStyles.title}>// NEW CADET</ThemedText>
            <Pressable onPress={onClose}>
              <ThemedText style={modalStyles.cancel}>CANCEL</ThemedText>
            </Pressable>
          </View>

          <ThemedText type="label" style={modalStyles.fieldLabel}>CALL SIGN (NICKNAME)</ThemedText>
          <View style={modalStyles.inputWrap}>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="e.g. Maverick"
              placeholderTextColor="#2A4A60"
              style={modalStyles.input}
              autoFocus
              autoCapitalize="words"
            />
          </View>

          <ThemedText type="label" style={[modalStyles.fieldLabel, { marginTop: Spacing.three }]}>THEME</ThemedText>
          <View style={modalStyles.themeRow}>
            {(['boy', 'girl'] as KidGender[]).map((g) => {
              const theme = getKidTheme(g);
              const isSelected = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[modalStyles.themeBtn, isSelected && { borderColor: theme.primary, backgroundColor: theme.bg }]}>
                  <ThemedText style={modalStyles.themeEmoji}>{g === 'boy' ? '💙' : '💗'}</ThemedText>
                  <ThemedText style={[modalStyles.themeLabel, isSelected && { color: theme.primary }]}>
                    {g === 'boy' ? 'BLUE / SKY' : 'PINK / PURPLE'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={submit}
            style={[modalStyles.addBtn, !nickname.trim() && { opacity: 0.4 }]}>
            <ThemedText style={modalStyles.addBtnText}>ACTIVATE PROFILE →</ThemedText>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── PIN Setup Modal ────────────────────────────────────────────────────────────

function PINSetupModal({ visible, accentColor, onComplete, onCancel }: {
  visible: boolean;
  accentColor: string;
  onComplete: (pin: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');

  const reset = () => { setStep('enter'); setFirstPin(''); setDigits(''); setError(''); };

  const handleClose = () => { reset(); onCancel(); };

  const pressKey = (k: string) => {
    if (digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (step === 'enter') {
          setFirstPin(next);
          setDigits('');
          setStep('confirm');
          setError('');
        } else {
          if (next === firstPin) {
            reset();
            onComplete(next);
          } else {
            setError("PINs don't match — try again");
            setDigits('');
            setStep('enter');
            setFirstPin('');
          }
        }
      }, 100);
    }
  };

  const del = () => setDigits((d) => d.slice(0, -1));
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0',''];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={pinSetupStyles.overlay}>
        <View style={[pinSetupStyles.card, { borderColor: accentColor + '40' }]}>
          <ThemedText style={[pinSetupStyles.title, { color: accentColor }]}>SET PARENT PIN</ThemedText>
          <ThemedText style={pinSetupStyles.subtitle}>
            {step === 'enter'
              ? 'Create a 4-digit PIN to lock and unlock kid mode.'
              : 'Confirm your PIN to make sure you have it right.'}
          </ThemedText>
          {error ? <ThemedText style={pinSetupStyles.error}>{error}</ThemedText> : null}

          <View style={pinSetupStyles.dots}>
            {[0,1,2,3].map((i) => (
              <View key={i} style={[pinSetupStyles.dot, { borderColor: accentColor }, digits.length > i && { backgroundColor: accentColor }]} />
            ))}
          </View>

          <View style={pinSetupStyles.grid}>
            {keys.map((k, idx) => (
              <Pressable
                key={idx}
                onPress={() => { if (k === '⌫') del(); else if (k !== '') pressKey(k); }}
                style={({ pressed }) => [
                  pinSetupStyles.key,
                  k === '' && { opacity: 0 },
                  pressed && k !== '' && { opacity: 0.6, backgroundColor: accentColor + '20' },
                ]}>
                <ThemedText style={[pinSetupStyles.keyText, k === '⌫' && { fontSize: 22 }]}>{k}</ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handleClose} style={pinSetupStyles.cancelBtn}>
            <ThemedText style={[pinSetupStyles.cancelText, { color: accentColor }]}>CANCEL</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const pinSetupStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: Spacing.three },
  card: { backgroundColor: '#04080F', borderWidth: 1, borderRadius: 12, padding: Spacing.three, width: '100%', maxWidth: 360, alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  subtitle: { fontSize: 12, color: '#6B92B0', textAlign: 'center', paddingHorizontal: Spacing.two },
  error: { fontSize: 12, color: '#E74C3C', textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 20, marginVertical: Spacing.two },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: 'transparent' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 240 },
  key: { width: 80, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  keyText: { fontSize: 26, fontWeight: '600', color: '#C8D8E8' },
  cancelBtn: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four },
  cancelText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
});

const modalStyles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#04080F' },
  safe: { flex: 1, padding: Spacing.four, gap: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 1, color: '#C8D8E8' },
  cancel: { fontSize: 12, fontWeight: '700', color: '#3D6080', letterSpacing: 1 },
  fieldLabel: { color: '#3D6080', fontSize: 9, marginBottom: 6 },
  inputWrap: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 4, paddingHorizontal: Spacing.three },
  input: { fontSize: 18, fontWeight: '700', paddingVertical: Spacing.two + 4, color: '#C8D8E8' },
  themeRow: { flexDirection: 'row', gap: Spacing.two },
  themeBtn: { flex: 1, borderWidth: 1.5, borderColor: Brand.border, borderRadius: 4, padding: Spacing.three, alignItems: 'center', gap: Spacing.one },
  themeEmoji: { fontSize: 28, lineHeight: 36 },
  themeLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#3D6080' },
  addBtn: { backgroundColor: Brand.accent, borderRadius: 4, padding: Spacing.three, alignItems: 'center', marginTop: 'auto' },
  addBtnText: { color: '#04080F', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
});

// ── Kid Card ───────────────────────────────────────────────────────────────────

function KidCard({ kid, onPress, onRemove, onHandOff }: { kid: KidProfile; onPress: () => void; onRemove: () => void; onHandOff: () => void }) {
  const theme = getKidTheme(kid.gender);
  const earned = kid.goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const target = kid.goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedToday = kid.chores.filter((c) =>
    c.completedDates.includes(new Date().toISOString().slice(0, 10))
  ).length;

  return (
    <View style={[kidCardStyles.wrapper, { borderColor: theme.primary + '40' }]}>
      <Pressable
        onPress={onPress}
        onLongPress={onRemove}
        style={({ pressed }) => [kidCardStyles.card, pressed && { opacity: 0.7 }]}>
        <View style={[kidCardStyles.accentBar, { backgroundColor: theme.primary }]} />
        <View style={kidCardStyles.content}>
          <View style={[kidCardStyles.avatar, { backgroundColor: theme.bg }]}>
            <ThemedText style={kidCardStyles.avatarEmoji}>{kid.gender === 'boy' ? '🚀' : '🌸'}</ThemedText>
          </View>
          <View style={kidCardStyles.info}>
            <ThemedText style={[kidCardStyles.name, { color: theme.accent }]}>{kid.nickname}</ThemedText>
            <View style={kidCardStyles.statsRow}>
              <ThemedText style={[kidCardStyles.stat, { color: theme.accent }]}>
                {kid.goals.length} goal{kid.goals.length !== 1 ? 's' : ''}
              </ThemedText>
              <ThemedText style={kidCardStyles.statDot}>·</ThemedText>
              <ThemedText style={[kidCardStyles.stat, { color: theme.accent }]}>
                {completedToday}/{kid.chores.length} chores today
              </ThemedText>
            </View>
            {target > 0 && (
              <View style={kidCardStyles.progressTrack}>
                <View style={[kidCardStyles.progressFill, {
                  width: `${Math.min(100, (earned / target) * 100)}%` as any,
                  backgroundColor: theme.primary,
                }]} />
              </View>
            )}
          </View>
          <ThemedText style={[kidCardStyles.arrow, { color: theme.primary }]}>›</ThemedText>
        </View>
      </Pressable>

      {/* Hand-off button */}
      <Pressable
        onPress={onHandOff}
        style={({ pressed }) => [
          kidCardStyles.handOffBtn,
          { backgroundColor: theme.primary + '12', borderTopColor: theme.primary + '30' },
          pressed && { opacity: 0.7 },
        ]}>
        <ThemedText style={[kidCardStyles.handOffText, { color: theme.primary }]}>
          👾 SWITCH TO {kid.nickname.toUpperCase()}'S VIEW ›
        </ThemedText>
      </Pressable>
    </View>
  );
}

const kidCardStyles = StyleSheet.create({
  wrapper: { borderWidth: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: '#080E1C' },
  card: { flexDirection: 'row' },
  accentBar: { width: 3 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: Spacing.three, gap: Spacing.two },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0D1E30', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 22, lineHeight: 28 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: '#C8D8E8' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stat: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statDot: { fontSize: 10, color: '#3D5870' },
  progressTrack: { height: 2, backgroundColor: '#0D1E30', borderRadius: 1, marginTop: 2 },
  progressFill: { height: '100%', borderRadius: 1 },
  handOffBtn: { paddingVertical: Spacing.one + 4, paddingHorizontal: Spacing.three, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  handOffText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  arrow: { fontSize: 22, fontWeight: '300' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function KidsScreen() {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [handOffKid, setHandOffKid] = useState<KidProfile | null>(null);
  const { isPro, kidsLimit } = useEntitlement();

  const kids = useKidsStore((s) => s.kids);
  const addKid = useKidsStore((s) => s.addKid);
  const removeKid = useKidsStore((s) => s.removeKid);

  const pin = useKidModeStore((s) => s.pin);
  const activate = useKidModeStore((s) => s.activate);
  const setPin = useKidModeStore((s) => s.setPin);

  useEffect(() => {
    useKidsStore.getState().hydrate();
  }, []);

  const handleHandOff = (kid: KidProfile) => {
    if (!pin) {
      setHandOffKid(kid);
    } else {
      activate(kid.id);
    }
  };

  const handlePINSetupComplete = (newPin: string) => {
    setPin(newPin);
    if (handOffKid) {
      activate(handOffKid.id);
      setHandOffKid(null);
    }
  };

  const handleRemove = (kid: KidProfile) => {
    Alert.alert(
      'Remove Cadet',
      `Remove ${kid.nickname}'s profile? All goals and chores will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeKid(kid.id) },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <SafeAreaView>
          <ThemedText type="label" style={styles.eyebrow}>// FAMILY COMMAND</ThemedText>
          <ThemedText style={styles.heading}>CADET HQ</ThemedText>
          <ThemedText type="label" style={styles.subhead}>GOALS · CHORES · MISSIONS</ThemedText>
        </SafeAreaView>

        {/* Kids list */}
        {kids.length > 0 ? (
          <View style={styles.kidsList}>
            {kids.map((kid) => (
              <KidCard
                key={kid.id}
                kid={kid}
                onPress={() => router.push(`/kids/${kid.id}` as any)}
                onRemove={() => handleRemove(kid)}
                onHandOff={() => handleHandOff(kid)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image source={require('../../assets/images/icon.png')} style={styles.emptyIcon} />
            <ThemedText style={styles.emptyTitle}>NO CADETS ENROLLED</ThemedText>
            <ThemedText type="label" style={styles.emptyBody}>
              Add a child profile to give them their own goals, chores, and savings missions.
            </ThemedText>
          </View>
        )}

        {/* Add button */}
        {kids.length < kidsLimit ? (
          <Pressable
            onPress={() => setShowAdd(true)}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.addBtnText}>+ ENROLL NEW CADET</ThemedText>
          </Pressable>
        ) : !isPro ? (
          <Pressable
            onPress={() => router.push('/upgrade' as any)}
            style={({ pressed }) => [styles.addBtn, styles.addBtnLocked, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.addBtnLockedText}>🔒 PRO — ENROLL MORE CADETS</ThemedText>
          </Pressable>
        ) : null}

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoEmoji}>🎯</ThemedText>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="label" style={styles.infoTitle}>HOW IT WORKS</ThemedText>
              <ThemedText type="label" style={styles.infoBody}>
                Kids set savings goals like a new bike or game. Parents add chores with dollar values. Every chore completed moves the bar forward — teaching real money skills.
              </ThemedText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoEmoji}>💡</ThemedText>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="label" style={styles.infoTitle}>PARENT TIP</ThemedText>
              <ThemedText type="label" style={styles.infoBody}>
                Long-press a cadet card to remove it. Tap to view goals, chores, and daily finance tips written just for kids.
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <AddKidModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addKid}
      />

      <PINSetupModal
        visible={!!handOffKid}
        accentColor={handOffKid ? getKidTheme(handOffKid.gender).primary : Brand.tactical}
        onComplete={handlePINSetupComplete}
        onCancel={() => setHandOffKid(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  eyebrow: { color: Brand.tactical, marginTop: Spacing.three, fontSize: 9 },
  heading: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 4 },
  subhead: { color: '#3D6080', fontSize: 9, marginTop: 2 },
  kidsList: { gap: Spacing.two },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.two },
  emptyIcon: { width: 80, height: 80, borderRadius: 18 },
  emptyTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 2, color: '#6B92B0' },
  emptyBody: { color: '#6B92B0', fontSize: 11, textAlign: 'center', lineHeight: 17, paddingHorizontal: Spacing.three },
  addBtn: {
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.tactical + '60',
    borderRadius: 4,
    padding: Spacing.three,
    alignItems: 'center',
  },
  addBtnText: { color: Brand.tactical, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  addBtnLocked: { borderColor: Brand.accent + '40', borderStyle: 'dashed' },
  addBtnLockedText: { color: Brand.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  infoCard: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  infoRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  infoEmoji: { fontSize: 18, width: 28, textAlign: 'center' },
  infoTitle: { color: Brand.accent, fontSize: 10, marginBottom: 2 },
  infoBody: { color: '#6B92B0', fontSize: 11, lineHeight: 16 },
});
