import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import {
  calcPayoff,
  fmtDate,
  fmtMonths,
  PayoffStrategy,
} from '@/features/debt/utils/debtCalc';
import { useThemeColors } from '@/hooks/use-theme';
import { Debt, useDebtStore } from '@/store/debt.store';

function fmtDollar(n: number): string {
  return '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
}

function SectionLabel({ text }: { text: string }) {
  const tc = useThemeColors();
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
      <ThemedText style={[styles.sectionText, { color: tc.textMuted }]}>{text}</ThemedText>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

function DebtFormModal({
  title,
  initial,
  onSave,
  onClose,
}: {
  title: string;
  initial?: Debt;
  onSave: (name: string, balance: number, apr: number, min: number) => void;
  onClose: () => void;
}) {
  const [name, setName]       = useState(initial?.name       ?? '');
  const [balance, setBalance] = useState(initial ? String(initial.balance)    : '');
  const [apr, setApr]         = useState(initial ? String(initial.apr)        : '');
  const [min, setMin]         = useState(initial ? String(initial.minPayment) : '');

  const canSave =
    name.trim().length > 0 &&
    parseFloat(balance) > 0 &&
    parseFloat(apr) >= 0 &&
    parseFloat(min) > 0;

  const tc = useThemeColors();

  return (
    <ThemedView type="backgroundElement" style={[styles.modal, { borderColor: tc.borderColor }]}>
      <ThemedText style={[styles.modalTitle, { color: tc.textPrimary }]}>{title}</ThemedText>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>Name</ThemedText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Credit Card, Car Loan"
        placeholderTextColor={tc.textMuted}
        style={[styles.input, { color: tc.textPrimary }]}
      />

      <View style={styles.fieldRow}>
        <View style={styles.fieldHalf}>
          <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>Balance ($)</ThemedText>
          <TextInput
            value={balance}
            onChangeText={setBalance}
            placeholder="5000"
            placeholderTextColor={tc.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: tc.textPrimary }]}
          />
        </View>
        <View style={styles.fieldHalf}>
          <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>APR (%)</ThemedText>
          <TextInput
            value={apr}
            onChangeText={setApr}
            placeholder="19.99"
            placeholderTextColor={tc.textMuted}
            keyboardType="decimal-pad"
            style={[styles.input, { color: tc.textPrimary }]}
          />
        </View>
      </View>

      <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>Minimum Payment ($)</ThemedText>
      <TextInput
        value={min}
        onChangeText={setMin}
        placeholder="150"
        placeholderTextColor={tc.textMuted}
        keyboardType="decimal-pad"
        style={[styles.input, { color: tc.textPrimary }]}
      />

      <View style={styles.modalBtns}>
        <Pressable onPress={onClose} style={[styles.cancelBtn, { borderColor: tc.borderColor }]}>
          <ThemedText style={[styles.cancelBtnText, { color: tc.textHint }]}>Cancel</ThemedText>
        </Pressable>
        <Pressable
          disabled={!canSave}
          onPress={() => {
            onSave(name.trim(), parseFloat(balance), parseFloat(apr), parseFloat(min));
            onClose();
          }}
          style={[styles.addBtn, !canSave && { opacity: 0.4 }]}>
          <ThemedText style={styles.addBtnText}>
            {initial ? 'Save Changes' : 'Add Debt'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function DebtCard({
  debt,
  onEdit,
  onRemove,
}: {
  debt: Debt;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const tc = useThemeColors();
  return (
    <Pressable
      onLongPress={() =>
        Alert.alert('Remove Debt', `Remove "${debt.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: onRemove },
        ])
      }>
      <ThemedView type="backgroundElement" style={styles.debtCard}>
        <View style={styles.debtLeft}>
          <ThemedText style={[styles.debtName, { color: tc.textPrimary }]}>{debt.name}</ThemedText>
          <ThemedText style={[styles.debtSub, { color: tc.textHint }]}>
            {debt.apr}% APR · min ${debt.minPayment.toLocaleString()}/mo
          </ThemedText>
        </View>
        <View style={styles.debtRight}>
          <ThemedText style={[styles.debtBalance, { color: tc.textPrimary }]}>{fmtDollar(debt.balance)}</ThemedText>
          <View style={styles.debtActions}>
            <ThemedText
              style={[
                styles.debtApr,
                debt.apr >= 20 ? styles.highApr : debt.apr >= 10 ? styles.midApr : styles.lowApr,
              ]}>
              {debt.apr}%
            </ThemedText>
            <Pressable onPress={onEdit} style={styles.editBtn} hitSlop={8}>
              <ThemedText style={styles.editBtnText}>✏ EDIT</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

export default function DebtPayoffScreen() {
  const router    = useRouter();
  const insets    = useSafeAreaInsets();
  const tc        = useThemeColors();

  const debts          = useDebtStore((s) => s.debts);
  const extraMonthly   = useDebtStore((s) => s.extraMonthly);
  const addDebt        = useDebtStore((s) => s.addDebt);
  const updateDebt     = useDebtStore((s) => s.updateDebt);
  const removeDebt     = useDebtStore((s) => s.removeDebt);
  const setExtraMonthly = useDebtStore((s) => s.setExtraMonthly);

  const [strategy, setStrategy]       = useState<PayoffStrategy>('avalanche');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt]  = useState<Debt | null>(null);
  const [extraInput, setExtraInput]    = useState(String(extraMonthly || ''));

  useEffect(() => {
    useDebtStore.getState().hydrate();
  }, []);

  const avalanche = useMemo(() => calcPayoff(debts, extraMonthly, 'avalanche'), [debts, extraMonthly]);
  const snowball  = useMemo(() => calcPayoff(debts, extraMonthly, 'snowball'),  [debts, extraMonthly]);

  const activeResult = strategy === 'avalanche' ? avalanche : snowball;

  const interestSaved =
    avalanche && snowball ? snowball.totalInterest - avalanche.totalInterest : 0;
  const monthsSaved =
    avalanche && snowball ? snowball.totalMonths - avalanche.totalMonths : 0;

  // Avalanche always saves equal or more interest by definition.
  // monthsSaved > 0 means avalanche also finishes sooner.
  const showCompare = (avalanche && snowball && interestSaved > 0) ?? false;

  const commitExtra = () => {
    const n = parseFloat(extraInput);
    setExtraMonthly(isNaN(n) ? 0 : Math.max(0, n));
  };

  const openAdd  = () => { setEditingDebt(null); setShowAddModal(true); };
  const openEdit = (d: Debt) => { setShowAddModal(false); setEditingDebt(d); };
  const closeModal = () => { setShowAddModal(false); setEditingDebt(null); };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ThemedText style={styles.backChevron}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>Debt Payoff</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Add / Edit modal */}
          {showAddModal && (
            <DebtFormModal
              title="ADD DEBT"
              onSave={(name, balance, apr, min) => addDebt(name, balance, apr, min)}
              onClose={closeModal}
            />
          )}
          {editingDebt && (
            <DebtFormModal
              title="EDIT DEBT"
              initial={editingDebt}
              onSave={(name, balance, apr, min) =>
                updateDebt(editingDebt.id, { name, balance, apr, minPayment: min })
              }
              onClose={closeModal}
            />
          )}

          {/* Debt List */}
          <SectionLabel text="YOUR DEBTS" />

          {debts.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText style={[styles.emptyText, { color: tc.textHint }]}>No debts added yet.</ThemedText>
              <ThemedText style={[styles.emptyHint, { color: tc.textMuted }]}>Tap the button below to add your first debt.</ThemedText>
            </ThemedView>
          ) : (
            debts.map((d) => (
              <DebtCard
                key={d.id}
                debt={d}
                onEdit={() => openEdit(d)}
                onRemove={() => removeDebt(d.id)}
              />
            ))
          )}

          <Pressable onPress={openAdd} style={styles.addDebtBtn}>
            <ThemedText style={styles.addDebtBtnText}>＋ Add Debt</ThemedText>
          </Pressable>

          {debts.length > 0 && (
            <>
              {/* Extra payment */}
              <SectionLabel text="EXTRA MONTHLY PAYMENT" />
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>
                  Extra money applied each month on top of minimums, directed at your target debt.
                </ThemedText>
                <View style={styles.extraRow}>
                  <ThemedText style={[styles.dollarSign, { color: tc.textPrimary }]}>$</ThemedText>
                  <TextInput
                    value={extraInput}
                    onChangeText={setExtraInput}
                    onBlur={commitExtra}
                    onSubmitEditing={commitExtra}
                    keyboardType="decimal-pad"
                    style={[styles.extraInput, { color: tc.textPrimary }]}
                    placeholder="0"
                    returnKeyType="done"
                  />
                  <ThemedText style={[styles.perMonth, { color: tc.textHint }]}>/mo extra</ThemedText>
                </View>
              </ThemedView>

              {/* Strategy toggle */}
              <SectionLabel text="PAYOFF STRATEGY" />
              <View style={styles.strategyRow}>
                <Pressable
                  onPress={() => setStrategy('avalanche')}
                  style={[styles.stratBtn, { borderColor: tc.borderColor }, strategy === 'avalanche' && styles.stratBtnActiveAvalanche]}>
                  <ThemedText style={[styles.stratLabel, { color: tc.textHint }, strategy === 'avalanche' && { color: tc.textPrimary }]}>
                    ❄️ Avalanche
                  </ThemedText>
                  <ThemedText style={[styles.stratSub, { color: tc.textMuted }, strategy === 'avalanche' && { color: Brand.tactical }]}>
                    Highest APR first · saves most interest
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setStrategy('snowball')}
                  style={[styles.stratBtn, { borderColor: tc.borderColor }, strategy === 'snowball' && styles.stratBtnActiveSnowball]}>
                  <ThemedText style={[styles.stratLabel, { color: tc.textHint }, strategy === 'snowball' && { color: tc.textPrimary }]}>
                    ⛄ Snowball
                  </ThemedText>
                  <ThemedText style={[styles.stratSub, { color: tc.textMuted }, strategy === 'snowball' && { color: Brand.accent }]}>
                    Smallest balance first · best momentum
                  </ThemedText>
                </Pressable>
              </View>

              {/* Avalanche vs Snowball comparison */}
              {showCompare && avalanche && snowball && (
                <ThemedView type="backgroundElement" style={[styles.compareBox, { borderLeftColor: Brand.tactical }]}>
                  <ThemedText style={styles.compareTitle}>❄️ AVALANCHE SAVES MORE</ThemedText>
                  <View style={styles.compareRow}>
                    <ThemedText style={[styles.compareLabel, { color: tc.textHint }]}>Interest saved vs Snowball</ThemedText>
                    <ThemedText style={[styles.compareVal, { color: Brand.tactical }]}>
                      {fmtDollar(interestSaved)}
                    </ThemedText>
                  </View>
                  {monthsSaved > 0 && (
                    <View style={styles.compareRow}>
                      <ThemedText style={[styles.compareLabel, { color: tc.textHint }]}>Paid off sooner</ThemedText>
                      <ThemedText style={[styles.compareVal, { color: Brand.tactical }]}>
                        {fmtMonths(monthsSaved)} faster
                      </ThemedText>
                    </View>
                  )}
                  {monthsSaved === 0 && (
                    <View style={styles.compareRow}>
                      <ThemedText style={[styles.compareLabel, { color: tc.textHint }]}>Same payoff timeline</ThemedText>
                      <ThemedText style={[styles.compareVal, { color: tc.textHint }]}>same date</ThemedText>
                    </View>
                  )}
                </ThemedView>
              )}

              {/* Active strategy results */}
              {activeResult && (
                <>
                  <SectionLabel text={`${strategy.toUpperCase()} RESULTS`} />
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.resultCard, {
                      borderLeftColor: strategy === 'avalanche' ? Brand.tactical : Brand.accent,
                    }]}>
                    <ThemedText style={[styles.resultEyebrow, { color: tc.textHint }]}>DEBT-FREE DATE</ThemedText>
                    <ThemedText
                      style={[styles.resultBig, {
                        color: strategy === 'avalanche' ? Brand.tactical : Brand.accent,
                      }]}>
                      {fmtDate(activeResult.payoffDate)}
                    </ThemedText>
                    <ThemedText style={[styles.resultSub, { color: tc.textHint }]}>{fmtMonths(activeResult.totalMonths)} from now</ThemedText>

                    <View style={styles.resultRows}>
                      <View style={styles.resultRow}>
                        <ThemedText style={[styles.resultLabel, { color: tc.textHint }]}>Total interest paid</ThemedText>
                        <ThemedText style={[styles.resultVal, { color: Brand.warning }]}>
                          {fmtDollar(activeResult.totalInterest)}
                        </ThemedText>
                      </View>
                      <View style={styles.resultRow}>
                        <ThemedText style={[styles.resultLabel, { color: tc.textHint }]}>Total amount paid</ThemedText>
                        <ThemedText style={[styles.resultVal, { color: tc.textPrimary }]}>{fmtDollar(activeResult.totalPaid)}</ThemedText>
                      </View>
                      <View style={styles.resultRow}>
                        <ThemedText style={[styles.resultLabel, { color: tc.textHint }]}>Monthly payment</ThemedText>
                        <ThemedText style={[styles.resultVal, { color: tc.textPrimary }]}>{fmtDollar(activeResult.monthlyCost)}/mo</ThemedText>
                      </View>
                    </View>
                  </ThemedView>

                  {/* Per-debt payoff order */}
                  <SectionLabel text="DEBT-BY-DEBT PAYOFF ORDER" />
                  {activeResult.rows.map((row, i) => (
                    <ThemedView key={row.id} type="backgroundElement" style={styles.rowCard}>
                      <View style={styles.rowLeft}>
                        <ThemedText style={[styles.rowOrder, { color: tc.textMuted }]}>#{i + 1}</ThemedText>
                        <View>
                          <ThemedText style={[styles.rowName, { color: tc.textPrimary }]}>{row.name}</ThemedText>
                          <ThemedText style={[styles.rowDate, { color: tc.textHint }]}>Paid off: {fmtDate(row.payoffDate)}</ThemedText>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <ThemedText style={styles.rowInterest}>+{fmtDollar(row.totalInterest)} interest</ThemedText>
                        <ThemedText style={[styles.rowMonths, { color: tc.textHint }]}>{fmtMonths(row.monthsToPayoff)}</ThemedText>
                      </View>
                    </ThemedView>
                  ))}
                </>
              )}
            </>
          )}

          <ThemedView type="backgroundElement" style={styles.noteCard}>
            <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
              Calculations assume fixed interest rates and constant payments. Actual payoff may vary with rate changes, late fees, or payment adjustments.{'\n'}Tap ✏ EDIT to modify a debt · Long-press a debt to remove it.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: 1 },
  sectionText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },

  modal: {
    borderRadius: 4, padding: Spacing.three, gap: Spacing.two,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  fieldLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  fieldRow: { flexDirection: 'row', gap: Spacing.two },
  fieldHalf: { flex: 1, gap: Spacing.one },
  input: {
    fontSize: 15, borderBottomWidth: 1.5,
    borderBottomColor: Brand.primary, paddingVertical: 4,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end', marginTop: Spacing.one },
  cancelBtn: {
    paddingVertical: 8, paddingHorizontal: Spacing.three,
    borderRadius: 4, borderWidth: 1,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600' },
  addBtn: {
    paddingVertical: 8, paddingHorizontal: Spacing.three,
    borderRadius: 4, backgroundColor: Brand.primary,
  },
  addBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  emptyCard: { borderRadius: 4, padding: Spacing.three, gap: 4, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '600' },
  emptyHint: { fontSize: 11 },

  debtCard: {
    borderRadius: 4, padding: Spacing.two + 4,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  debtLeft: { flex: 1, gap: 3 },
  debtName: { fontSize: 14, fontWeight: '700' },
  debtSub: { fontSize: 10 },
  debtRight: { alignItems: 'flex-end', gap: 4 },
  debtBalance: { fontSize: 16, fontWeight: '800' },
  debtActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  debtApr: { fontSize: 10, fontWeight: '700' },
  highApr: { color: Brand.danger },
  midApr:  { color: Brand.warning },
  lowApr:  { color: Brand.tactical },
  editBtn: {
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 3, borderWidth: 1, borderColor: Brand.primary + '60',
  },
  editBtnText: { fontSize: 9, fontWeight: '800', color: Brand.primary, letterSpacing: 0.5 },

  addDebtBtn: {
    borderRadius: 4, borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: Brand.primary + '60', padding: Spacing.two + 4,
    alignItems: 'center',
  },
  addDebtBtnText: { fontSize: 13, fontWeight: '700', color: Brand.primary },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardHint: { fontSize: 11, lineHeight: 16 },

  extraRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dollarSign: { fontSize: 18, fontWeight: '300' },
  extraInput: {
    fontSize: 22, fontWeight: '700',
    borderBottomWidth: 2, borderBottomColor: Brand.primary,
    paddingVertical: 2, minWidth: 80,
  },
  perMonth: { fontSize: 12 },

  strategyRow: { flexDirection: 'row', gap: Spacing.two },
  stratBtn: {
    flex: 1, borderRadius: 4, borderWidth: 1,
    padding: Spacing.two, gap: 3,
  },
  stratBtnActiveAvalanche: { backgroundColor: Brand.tactical + '20', borderColor: Brand.tactical },
  stratBtnActiveSnowball:  { backgroundColor: Brand.accent  + '20', borderColor: Brand.accent  },
  stratLabel: { fontSize: 13, fontWeight: '800' },
  stratSub:   { fontSize: 9,  lineHeight: 13 },

  compareBox: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one, borderLeftWidth: 3 },
  compareTitle: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1, marginBottom: 4 },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between' },
  compareLabel: { fontSize: 12 },
  compareVal: { fontSize: 12, fontWeight: '700' },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  resultBig: { fontSize: 26, lineHeight: 32, fontWeight: '900' },
  resultSub: { fontSize: 11, marginTop: -6 },
  resultRows: { gap: Spacing.one },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { fontSize: 12 },
  resultVal: { fontSize: 12, fontWeight: '700' },

  rowCard: {
    borderRadius: 4, padding: Spacing.two + 4,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  rowLeft: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', flex: 1 },
  rowOrder: { fontSize: 16, fontWeight: '900', width: 24 },
  rowName: { fontSize: 13, fontWeight: '700' },
  rowDate: { fontSize: 10 },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowInterest: { fontSize: 11, color: Brand.warning, fontWeight: '600' },
  rowMonths: { fontSize: 11 },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, lineHeight: 16 },
});
