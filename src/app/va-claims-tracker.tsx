import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { DatePickerModal } from '@/components/DatePickerModal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import {
  CLAIM_STAGES,
  CLAIM_TYPES,
  ClaimStage,
  ClaimType,
  useVaClaimsStore,
  VaClaim,
} from '@/store/va-claims.store';

// Standard VA appeal window: 1 year from the date a decision is mailed to
// file a Notice of Disagreement / Higher-Level Review / Supplemental Claim.
const APPEAL_WINDOW_DAYS = 365;

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function daysBetweenTodayAnd(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function stageLabel(stage: ClaimStage): string {
  return CLAIM_STAGES.find((s) => s.value === stage)?.label ?? stage;
}
function claimTypeLabel(type: ClaimType): string {
  return CLAIM_TYPES.find((t) => t.value === type)?.label ?? type;
}

// ── Claim Card ───────────────────────────────────────────────────────────────

function ClaimCard({ claim, onPress }: { claim: VaClaim; onPress: () => void }) {
  const tc = useThemeColors();
  const stageIdx = CLAIM_STAGES.findIndex((s) => s.value === claim.stage);
  const pct = (stageIdx + 1) / CLAIM_STAGES.length;

  // Only decision-stage claims are on an active appeal clock, and only until
  // the member marks it as already appealing.
  const deadline = claim.stage === 'decision' && claim.decisionDate
    ? addDays(claim.decisionDate, APPEAL_WINDOW_DAYS)
    : null;
  const daysLeft = deadline ? daysBetweenTodayAnd(deadline) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: tc.surface, borderColor: tc.borderColor },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={styles.cardTopRow}>
        <ThemedText style={[styles.cardLabel, { color: tc.textPrimary }]} numberOfLines={1}>
          {claim.label || 'Untitled Claim'}
        </ThemedText>
        <View style={[styles.typeBadge, { backgroundColor: `${Brand.tactical}20` }]}>
          <ThemedText style={[styles.typeBadgeText, { color: tc.tactical }]}>{claimTypeLabel(claim.claimType)}</ThemedText>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
      </View>
      <ThemedText style={[styles.stageText, { color: tc.textSecondary }]}>{stageLabel(claim.stage)}</ThemedText>

      {claim.stage === 'decision' && claim.ratingAwarded != null && (
        <ThemedText style={[styles.ratingLine, { color: tc.tactical }]}>
          Decision: {claim.ratingAwarded}% awarded
        </ThemedText>
      )}

      {deadline && daysLeft != null && (
        <View style={[
          styles.deadlineBanner,
          { backgroundColor: daysLeft <= 60 ? `${Brand.danger}18` : daysLeft <= 120 ? `${Brand.warning}18` : `${Brand.tactical}12` },
        ]}>
          <ThemedText style={[
            styles.deadlineText,
            { color: daysLeft <= 60 ? Brand.danger : daysLeft <= 120 ? tc.warning : tc.textSecondary },
          ]}>
            {daysLeft >= 0
              ? `Appeal window: file by ${fmtDate(deadline)} (${daysLeft} days left)`
              : `Appeal window closed ${fmtDate(deadline)}`}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

// ── Add / Edit Modal ─────────────────────────────────────────────────────────

function ClaimFormModal({
  initial,
  onSave,
  onDelete,
  onClose,
}: {
  initial?: VaClaim;
  onSave: (data: Omit<VaClaim, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const tc = useThemeColors();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [claimType, setClaimType] = useState<ClaimType>(initial?.claimType ?? 'initial');
  const [stage, setStage] = useState<ClaimStage>(initial?.stage ?? 'intent_filed');
  const [dateFiled, setDateFiled] = useState(initial?.dateFiled ?? '');
  const [examDate, setExamDate] = useState(initial?.examDate ?? '');
  const [decisionDate, setDecisionDate] = useState(initial?.decisionDate ?? '');
  const [ratingAwarded, setRatingAwarded] = useState(initial?.ratingAwarded != null ? String(initial.ratingAwarded) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [pickerField, setPickerField] = useState<'filed' | 'exam' | 'decision' | null>(null);

  // Re-seed every field whenever the claim being edited changes. This modal
  // is rendered inline (not a real overlay <Modal>), so the list underneath
  // stays tappable while it's open — tapping a different claim's card swaps
  // `initial` without unmounting this component. Without this, the form
  // would keep showing the previous claim's stale values while saving them
  // onto the newly-selected claim's id (the same bug class fixed in
  // debt-payoff.tsx's DebtFormModal).
  useEffect(() => {
    setLabel(initial?.label ?? '');
    setClaimType(initial?.claimType ?? 'initial');
    setStage(initial?.stage ?? 'intent_filed');
    setDateFiled(initial?.dateFiled ?? '');
    setExamDate(initial?.examDate ?? '');
    setDecisionDate(initial?.decisionDate ?? '');
    setRatingAwarded(initial?.ratingAwarded != null ? String(initial.ratingAwarded) : '');
    setNotes(initial?.notes ?? '');
  }, [initial?.id]);

  const canSave = label.trim().length > 0;

  const submit = () => {
    if (!canSave) return;
    const rating = parseFloat(ratingAwarded);
    onSave({
      label: label.trim(),
      claimType,
      stage,
      dateFiled: dateFiled || undefined,
      examDate: examDate || undefined,
      decisionDate: decisionDate || undefined,
      effectiveDate: initial?.effectiveDate,
      ratingAwarded: isNaN(rating) ? undefined : rating,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Delete Claim', `Remove "${label || 'this claim'}" from your tracker?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete?.(); onClose(); } },
    ]);
  };

  return (
    <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: tc.borderColor }]}>
      <ThemedText style={[styles.modalTitle, { color: tc.textPrimary }]}>{initial ? 'EDIT CLAIM' : 'ADD CLAIM'}</ThemedText>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>CONDITION / DESCRIPTION</ThemedText>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="e.g. Lower back strain, tinnitus increase"
        placeholderTextColor={tc.textHint}
        style={[styles.input, { color: tc.textPrimary, backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}
        autoCapitalize="sentences"
      />

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>CLAIM TYPE</ThemedText>
      <View style={styles.chipRow}>
        {CLAIM_TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setClaimType(t.value)}
            style={[
              styles.chip,
              { borderColor: tc.borderColor },
              claimType === t.value && { backgroundColor: Brand.tactical, borderColor: Brand.tactical },
            ]}>
            <ThemedText style={[styles.chipText, { color: claimType === t.value ? '#FFFFFF' : tc.textSecondary }]}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>STAGE</ThemedText>
      <View style={styles.chipRow}>
        {CLAIM_STAGES.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => setStage(s.value)}
            style={[
              styles.chip,
              { borderColor: tc.borderColor },
              stage === s.value && { backgroundColor: Brand.accent, borderColor: Brand.accent },
            ]}>
            <ThemedText style={[styles.chipText, { color: stage === s.value ? '#FFFFFF' : tc.textSecondary }]}>
              {s.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>DATE FILED</ThemedText>
      <Pressable
        onPress={() => setPickerField('filed')}
        style={[styles.dateInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
        <ThemedText style={{ color: dateFiled ? tc.textPrimary : tc.textHint }}>
          {dateFiled ? fmtDate(dateFiled) : 'Tap to select date'}
        </ThemedText>
        <ThemedText style={{ fontSize: 16 }}>📅</ThemedText>
      </Pressable>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>C&P EXAM DATE (IF SCHEDULED)</ThemedText>
      <Pressable
        onPress={() => setPickerField('exam')}
        style={[styles.dateInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
        <ThemedText style={{ color: examDate ? tc.textPrimary : tc.textHint }}>
          {examDate ? fmtDate(examDate) : 'Tap to select date'}
        </ThemedText>
        <ThemedText style={{ fontSize: 16 }}>📅</ThemedText>
      </Pressable>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>DECISION DATE (IF RECEIVED)</ThemedText>
      <Pressable
        onPress={() => setPickerField('decision')}
        style={[styles.dateInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
        <ThemedText style={{ color: decisionDate ? tc.textPrimary : tc.textHint }}>
          {decisionDate ? fmtDate(decisionDate) : 'Tap to select date'}
        </ThemedText>
        <ThemedText style={{ fontSize: 16 }}>📅</ThemedText>
      </Pressable>
      {decisionDate && (
        <ThemedText style={[styles.fieldHint, { color: tc.tactical }]}>
          ↳ Appeal deadline: {fmtDate(addDays(decisionDate, APPEAL_WINDOW_DAYS))} (1 year from decision)
        </ThemedText>
      )}

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>RATING AWARDED (%, IF DECIDED)</ThemedText>
      <TextInput
        value={ratingAwarded}
        onChangeText={setRatingAwarded}
        placeholder="e.g. 30"
        placeholderTextColor={tc.textHint}
        keyboardType="number-pad"
        style={[styles.input, { color: tc.textPrimary, backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}
      />

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>NOTES</ThemedText>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="VSO contact, exam location, anything to remember"
        placeholderTextColor={tc.textHint}
        multiline
        style={[styles.input, styles.notesInput, { color: tc.textPrimary, backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}
      />

      <View style={styles.modalBtnRow}>
        {initial && onDelete && (
          <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: Brand.danger }]}>
            <ThemedText style={[styles.deleteBtnText, { color: Brand.danger }]}>Delete</ThemedText>
          </Pressable>
        )}
        <Pressable onPress={onClose} style={[styles.cancelBtn, { borderColor: tc.borderColor }]}>
          <ThemedText style={{ color: tc.textSecondary, fontWeight: '600' }}>Cancel</ThemedText>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={!canSave}
          style={[styles.saveBtn, { backgroundColor: Brand.tactical }, !canSave && { opacity: 0.4 }]}>
          <ThemedText style={styles.saveBtnText}>Save</ThemedText>
        </Pressable>
      </View>

      <DatePickerModal
        visible={pickerField === 'filed'}
        value={dateFiled}
        title="Date Filed"
        onConfirm={(d) => { setDateFiled(d); setPickerField(null); }}
        onCancel={() => setPickerField(null)}
      />
      <DatePickerModal
        visible={pickerField === 'exam'}
        value={examDate}
        title="C&P Exam Date"
        onConfirm={(d) => { setExamDate(d); setPickerField(null); }}
        onCancel={() => setPickerField(null)}
      />
      <DatePickerModal
        visible={pickerField === 'decision'}
        value={decisionDate}
        title="Decision Date"
        onConfirm={(d) => { setDecisionDate(d); setPickerField(null); }}
        onCancel={() => setPickerField(null)}
      />
    </ThemedView>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function VaClaimsTrackerScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();

  const claims = useVaClaimsStore((s) => s.claims);
  const addClaim = useVaClaimsStore((s) => s.addClaim);
  const updateClaim = useVaClaimsStore((s) => s.updateClaim);
  const removeClaim = useVaClaimsStore((s) => s.removeClaim);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingClaim = claims.find((c) => c.id === editingId) ?? null;

  const openAdd = () => { setEditingId(null); setShowAdd(true); };
  const openEdit = (id: string) => { setShowAdd(false); setEditingId(id); };
  const closeModal = () => { setShowAdd(false); setEditingId(null); };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ThemedText style={styles.backChevron}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>VA Claims & Appeals</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <ThemedText style={[styles.intro, { color: tc.textSecondary }]}>
            Track every disability claim, increase, or appeal from filing to decision — including your one-year
            appeal deadline once a decision arrives. This is a personal log only; it doesn&apos;t submit anything
            to the VA.
          </ThemedText>

          {showAdd && (
            <ClaimFormModal
              onSave={(data) => addClaim(data)}
              onClose={closeModal}
            />
          )}
          {editingClaim && (
            <ClaimFormModal
              initial={editingClaim}
              onSave={(data) => updateClaim(editingClaim.id, data)}
              onDelete={() => removeClaim(editingClaim.id)}
              onClose={closeModal}
            />
          )}

          {claims.length === 0 && !showAdd ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText style={[styles.emptyText, { color: tc.textHint }]}>No claims tracked yet.</ThemedText>
              <ThemedText style={[styles.emptyHint, { color: tc.textMuted }]}>
                Add your first claim to start tracking its stage and appeal deadline.
              </ThemedText>
            </ThemedView>
          ) : (
            claims.map((c) => (
              <ClaimCard key={c.id} claim={c} onPress={() => openEdit(c.id)} />
            ))
          )}

          <Pressable onPress={openAdd} style={styles.addBtn}>
            <ThemedText style={styles.addBtnText}>＋ Add Claim</ThemedText>
          </Pressable>

          <ThemedView type="backgroundElement" style={styles.footer}>
            <ThemedText style={[styles.footerTitle, { color: tc.textPrimary }]}>Need help with a claim?</ThemedText>
            <ThemedText style={[styles.footerText, { color: tc.textSecondary }]}>
              VSOs (DAV, VFW, American Legion) file and track claims for FREE — never pay a &quot;claims consultant.&quot;
              Check status anytime at va.gov or 800-827-1000. If a decision has been out 90+ days with no update,
              contact your VSO.
            </ThemedText>
          </ThemedView>
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

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  intro: { fontSize: 12, lineHeight: 18, marginBottom: Spacing.one },

  emptyCard: { borderRadius: 8, padding: Spacing.four, alignItems: 'center', gap: 6 },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyHint: { fontSize: 12, textAlign: 'center' },

  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: 6,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  progressTrack: { height: 4, backgroundColor: Brand.border, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  progressFill: { height: '100%', backgroundColor: Brand.accent, borderRadius: 2 },
  stageText: { fontSize: 11, fontWeight: '700' },
  ratingLine: { fontSize: 12, fontWeight: '700' },

  deadlineBanner: { borderRadius: 6, padding: Spacing.two, marginTop: 2 },
  deadlineText: { fontSize: 11, fontWeight: '700', lineHeight: 15 },

  addBtn: {
    borderWidth: 1.5,
    borderColor: Brand.primary + '60',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  addBtnText: { color: Brand.primary, fontWeight: '700', fontSize: 14 },

  modal: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: 6,
    marginBottom: Spacing.two,
  },
  modalTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 8 },
  fieldHint: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 13,
  },
  notesInput: { minHeight: 60, textAlignVertical: 'top' },
  dateInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 11, fontWeight: '700' },

  modalBtnRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, alignItems: 'center' },
  deleteBtn: { borderWidth: 1, borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  deleteBtnText: { fontWeight: '700', fontSize: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 6, paddingVertical: Spacing.two, alignItems: 'center' },
  saveBtn: { flex: 1, borderRadius: 6, paddingVertical: Spacing.two, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700' },

  footer: { borderRadius: 8, padding: Spacing.three, gap: 4, marginTop: Spacing.two },
  footerTitle: { fontSize: 13, fontWeight: '700' },
  footerText: { fontSize: 11, lineHeight: 17 },
});
