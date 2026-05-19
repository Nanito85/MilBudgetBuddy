import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { fmtPay } from '@/features/home/utils/lesCalc';
import {
  BudgetCategory,
  CUSTOM_PREFIX,
  MAX_CUSTOM_CATEGORIES,
  useBudgetStore,
} from '@/store/budget.store';
import {
  currentMonthKey,
  Expense,
  useExpensesStore,
} from '@/store/expenses.store';
import { useUserStore } from '@/store/user.store';

const CUSTOM_EMOJIS = ['📦', '🎯', '🛍️', '🔧', '🏋️', '🐾', '🎓', '💊', '✈️', '🏡'];

// ── Budget allocation row ────────────────────────────────────────────────────

function CategoryRow({ cat, netPay }: { cat: BudgetCategory; netPay: number }) {
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [amountVal, setAmountVal] = useState(cat.monthlyBudget > 0 ? String(cat.monthlyBudget) : '');
  const [nameVal, setNameVal] = useState(cat.name);
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const removeCategory = useBudgetStore((s) => s.removeCategory);
  const isCustom = cat.id.startsWith(CUSTOM_PREFIX);

  const pct = netPay > 0 && cat.monthlyBudget > 0
    ? Math.round((cat.monthlyBudget / netPay) * 100)
    : null;

  const commitAmount = () => {
    const n = parseFloat(amountVal);
    updateCategory(cat.id, isNaN(n) ? 0 : Math.max(0, n));
    setEditingAmount(false);
  };

  const commitName = () => {
    const trimmed = nameVal.trim();
    if (trimmed) updateCategory(cat.id, cat.monthlyBudget, trimmed);
    setEditingName(false);
  };

  const handleLongPress = () => {
    if (!isCustom) return;
    Alert.alert('Remove Category', `Remove "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCategory(cat.id) },
    ]);
  };

  return (
    <Pressable onLongPress={handleLongPress}>
      <ThemedView type="backgroundElement" style={styles.catRow}>
        <ThemedText style={styles.catEmoji}>{cat.emoji}</ThemedText>
        <View style={styles.catInfo}>
          {isCustom && editingName ? (
            <TextInput
              value={nameVal}
              onChangeText={setNameVal}
              onBlur={commitName}
              onSubmitEditing={commitName}
              autoFocus
              style={[styles.nameInput]}
              placeholder="Category name"
              returnKeyType="done"
            />
          ) : (
            <Pressable onPress={isCustom ? () => { setNameVal(cat.name); setEditingName(true); } : undefined}>
              <ThemedText style={styles.catName}>{cat.name}</ThemedText>
            </Pressable>
          )}
          {pct !== null && !editingName && (
            <ThemedText type="small" themeColor="textSecondary">{pct}% of net pay</ThemedText>
          )}
          {isCustom && !editingName && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.tapToRename}>
              Tap name to rename · Long-press to delete
            </ThemedText>
          )}
        </View>
        {editingAmount ? (
          <TextInput
            value={amountVal}
            onChangeText={setAmountVal}
            onBlur={commitAmount}
            onSubmitEditing={commitAmount}
            keyboardType="decimal-pad"
            autoFocus
            style={styles.input}
            placeholder="0"
          />
        ) : (
          <Pressable onPress={() => { setAmountVal(cat.monthlyBudget > 0 ? String(cat.monthlyBudget) : ''); setEditingAmount(true); }}>
            <ThemedText style={[styles.catAmount, cat.monthlyBudget === 0 && styles.unset]}>
              {cat.monthlyBudget > 0 ? fmtPay(cat.monthlyBudget) : 'Set'}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </Pressable>
  );
}

function AddCustomRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  };

  return (
    <ThemedView type="backgroundElement" style={styles.addRow}>
      <ThemedText style={styles.addEmoji}>➕</ThemedText>
      <TextInput
        ref={inputRef}
        value={name}
        onChangeText={setName}
        placeholder="Add custom category..."
        placeholderTextColor="rgba(128,128,128,0.5)"
        style={styles.addInput}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {name.trim().length > 0 && (
        <Pressable onPress={submit} style={styles.addBtn}>
          <ThemedText style={styles.addBtnText}>Add</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

// ── Spending tracker row ─────────────────────────────────────────────────────

function SpendingRow({
  cat,
  spent,
  onAddExpense,
}: {
  cat: BudgetCategory;
  spent: number;
  onAddExpense: (catId: string, catName: string, catEmoji: string) => void;
}) {
  const budget = cat.monthlyBudget;
  const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const over = budget > 0 && spent > budget;
  const barColor = over ? Brand.danger : spent / (budget || 1) > 0.8 ? Brand.warning : Brand.tactical;

  return (
    <ThemedView type="backgroundElement" style={styles.spendRow}>
      <View style={styles.spendTop}>
        <ThemedText style={styles.catEmoji}>{cat.emoji}</ThemedText>
        <View style={styles.catInfo}>
          <ThemedText style={styles.catName}>{cat.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {fmtPay(spent)} spent{budget > 0 ? ` of ${fmtPay(budget)}` : ' (no budget set)'}
          </ThemedText>
        </View>
        <Pressable onPress={() => onAddExpense(cat.id, cat.name, cat.emoji)} style={styles.logBtn}>
          <ThemedText style={styles.logBtnText}>+ Log</ThemedText>
        </Pressable>
      </View>
      {budget > 0 && (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
        </View>
      )}
      {over && (
        <ThemedText style={styles.overText}>
          Over by {fmtPay(spent - budget)}
        </ThemedText>
      )}
    </ThemedView>
  );
}

// ── Recent expenses list ──────────────────────────────────────────────────────

function ExpenseItem({ expense, catName, catEmoji }: { expense: Expense; catName: string; catEmoji: string }) {
  const removeExpense = useExpensesStore((s) => s.removeExpense);

  const handleLongPress = () => {
    Alert.alert('Delete Expense', `Remove $${expense.amount.toFixed(2)} from ${catName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeExpense(expense.id) },
    ]);
  };

  const dateLabel = new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  });

  return (
    <Pressable onLongPress={handleLongPress}>
      <View style={styles.expenseItem}>
        <ThemedText style={styles.expenseEmoji}>{catEmoji}</ThemedText>
        <View style={styles.expenseInfo}>
          <ThemedText style={styles.expenseCat}>{catName}</ThemedText>
          {expense.note ? (
            <ThemedText type="small" themeColor="textSecondary">{expense.note}</ThemedText>
          ) : null}
        </View>
        <View style={styles.expenseRight}>
          <ThemedText style={styles.expenseAmt}>{fmtPay(expense.amount)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{dateLabel}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

// ── Add Expense modal (inline) ────────────────────────────────────────────────

function AddExpensePanel({
  catId,
  catName,
  catEmoji,
  onClose,
}: {
  catId: string;
  catName: string;
  catEmoji: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const addExpense = useExpensesStore((s) => s.addExpense);

  const submit = () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid dollar amount.');
      return;
    }
    addExpense(catId, n, note.trim());
    onClose();
  };

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <View style={styles.panelHeader}>
        <ThemedText style={styles.panelTitle}>{catEmoji} Log Expense — {catName}</ThemedText>
        <Pressable onPress={onClose}>
          <ThemedText style={styles.panelClose}>✕</ThemedText>
        </Pressable>
      </View>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount ($)"
        placeholderTextColor="rgba(128,128,128,0.5)"
        keyboardType="decimal-pad"
        autoFocus
        style={styles.panelInput}
      />
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Note (optional)"
        placeholderTextColor="rgba(128,128,128,0.5)"
        style={styles.panelInput}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <Pressable onPress={submit} style={styles.panelSubmit}>
        <ThemedText style={styles.panelSubmitText}>Save Expense</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

type Mode = 'budget' | 'spending';

export default function BudgetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('budget');
  const [addingFor, setAddingFor] = useState<{ id: string; name: string; emoji: string } | null>(null);

  const categories = useBudgetStore((s) => s.categories);
  const totalBudgeted = useBudgetStore((s) => s.totalBudgeted)();
  const addCategory = useBudgetStore((s) => s.addCategory);

  const mk = currentMonthKey();
  const spentByCategory = useExpensesStore((s) => s.spentByCategory)(mk);
  const totalSpent = useExpensesStore((s) => s.totalSpent)(mk);
  const allExpenses = useExpensesStore((s) => s.expenses).filter((e) => e.date.startsWith(mk));

  const payGrade = useUserStore((s) => s.payGrade);
  const yos = useUserStore((s) => s.yos);
  const mhaZip = useUserStore((s) => s.mhaZip);
  const hasSpouse = useUserStore((s) => s.hasSpouse);
  const specialPays = useUserStore((s) => s.specialPays);
  const tspContribPct = useUserStore((s) => s.tspContribPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut = useUserStore((s) => s.sglOptOut);

  useEffect(() => {
    useBudgetStore.getState().hydrate();
    useExpensesStore.getState().hydrate();
  }, []);

  const netPay = React.useMemo(() => {
    if (!payGrade) return 0;
    const { calcLES } = require('@/features/home/utils/lesCalc');
    const specialPaysTotal = specialPays.reduce((s: number, p: any) => s + p.monthlyAmount, 0);
    return calcLES({ payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, hasDentalFamily, sglOptOut }).netPay;
  }, [payGrade, yos, mhaZip, hasSpouse, specialPays, tspContribPct, hasDentalFamily, sglOptOut]);

  const remaining = netPay - totalBudgeted;
  const overBudget = remaining < 0;

  const customCategories = categories.filter((c) => c.id.startsWith(CUSTOM_PREFIX));
  const canAddMore = customCategories.length < MAX_CUSTOM_CATEGORIES;

  const handleAddCustom = (name: string) => {
    const index = customCategories.length;
    const emoji = CUSTOM_EMOJIS[index % CUSTOM_EMOJIS.length];
    addCategory(name, emoji, CUSTOM_PREFIX);
  };

  const catMap = React.useMemo(() => {
    const m: Record<string, BudgetCategory> = {};
    for (const c of categories) m[c.id] = c;
    return m;
  }, [categories]);

  // Month label e.g. "May 2026"
  const monthLabel = new Date(mk + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={styles.back}>
            <ThemedText style={styles.backChevron}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>Monthly Budget</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Mode toggle */}
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('budget')} style={[styles.modeBtn, mode === 'budget' && styles.modeBtnActive]}>
            <ThemedText style={[styles.modeBtnText, mode === 'budget' && styles.modeBtnTextActive]}>BUDGET</ThemedText>
          </Pressable>
          <Pressable onPress={() => setMode('spending')} style={[styles.modeBtn, mode === 'spending' && styles.modeBtnActive]}>
            <ThemedText style={[styles.modeBtnText, mode === 'spending' && styles.modeBtnTextActive]}>SPENDING</ThemedText>
          </Pressable>
        </View>

        {/* Summary bar */}
        <ThemedView type="backgroundElement" style={styles.summaryBar}>
          {mode === 'budget' ? (
            <>
              <View style={styles.summaryItem}>
                <ThemedText type="small" themeColor="textSecondary">Net Income</ThemedText>
                <ThemedText style={styles.summaryValue}>{fmtPay(netPay)}</ThemedText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <ThemedText type="small" themeColor="textSecondary">Budgeted</ThemedText>
                <ThemedText style={styles.summaryValue}>{fmtPay(totalBudgeted)}</ThemedText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <ThemedText type="small" themeColor="textSecondary">Remaining</ThemedText>
                <ThemedText style={[styles.summaryValue, overBudget && styles.over]}>
                  {overBudget ? `-${fmtPay(Math.abs(remaining))}` : fmtPay(remaining)}
                </ThemedText>
              </View>
            </>
          ) : (
            <>
              <View style={styles.summaryItem}>
                <ThemedText type="small" themeColor="textSecondary">Budgeted</ThemedText>
                <ThemedText style={styles.summaryValue}>{fmtPay(totalBudgeted)}</ThemedText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <ThemedText type="small" themeColor="textSecondary">Spent ({monthLabel})</ThemedText>
                <ThemedText style={[styles.summaryValue, totalSpent > totalBudgeted && styles.over]}>
                  {fmtPay(totalSpent)}
                </ThemedText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <ThemedText type="small" themeColor="textSecondary">Left</ThemedText>
                <ThemedText style={[styles.summaryValue, totalSpent > totalBudgeted && styles.over]}>
                  {totalSpent > totalBudgeted
                    ? `-${fmtPay(totalSpent - totalBudgeted)}`
                    : fmtPay(totalBudgeted - totalSpent)}
                </ThemedText>
              </View>
            </>
          )}
        </ThemedView>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.five }]}
          keyboardShouldPersistTaps="handled">

          {mode === 'budget' && (
            <>
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                Tap an amount to edit.
              </ThemedText>

              {categories.filter((c) => !c.id.startsWith(CUSTOM_PREFIX)).map((cat) => (
                <CategoryRow key={cat.id} cat={cat} netPay={netPay} />
              ))}

              {customCategories.length > 0 && (
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sectionDivider}>
                    CUSTOM ({customCategories.length}/{MAX_CUSTOM_CATEGORIES})
                  </ThemedText>
                  {customCategories.map((cat) => (
                    <CategoryRow key={cat.id} cat={cat} netPay={netPay} />
                  ))}
                </>
              )}

              {canAddMore && <AddCustomRow onAdd={handleAddCustom} />}

              {!canAddMore && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.maxNote}>
                  Maximum of {MAX_CUSTOM_CATEGORIES} custom categories reached.
                </ThemedText>
              )}

              {overBudget && (
                <ThemedView type="backgroundElement" style={styles.warningBox}>
                  <ThemedText style={styles.warningText}>
                    ⚠ You&apos;ve budgeted {fmtPay(Math.abs(remaining))} more than your estimated net pay. Adjust your categories to balance your budget.
                  </ThemedText>
                </ThemedView>
              )}
            </>
          )}

          {mode === 'spending' && (
            <>
              {addingFor && (
                <AddExpensePanel
                  catId={addingFor.id}
                  catName={addingFor.name}
                  catEmoji={addingFor.emoji}
                  onClose={() => setAddingFor(null)}
                />
              )}

              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                Tap &quot;+ Log&quot; to record an expense. Long-press a transaction to delete.
              </ThemedText>

              {categories.map((cat) => (
                <SpendingRow
                  key={cat.id}
                  cat={cat}
                  spent={spentByCategory[cat.id] ?? 0}
                  onAddExpense={(id, name, emoji) => setAddingFor({ id, name, emoji })}
                />
              ))}

              {/* Recent transactions */}
              {allExpenses.length > 0 && (
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={[styles.sectionDivider, { marginTop: Spacing.three }]}>
                    TRANSACTIONS — {monthLabel.toUpperCase()}
                  </ThemedText>
                  {allExpenses.map((e) => {
                    const cat = catMap[e.categoryId];
                    return (
                      <ExpenseItem
                        key={e.id}
                        expense={e}
                        catName={cat?.name ?? 'Unknown'}
                        catEmoji={cat?.emoji ?? '📦'}
                      />
                    );
                  })}
                </>
              )}

              {allExpenses.length === 0 && (
                <ThemedView type="backgroundElement" style={styles.emptyBox}>
                  <ThemedText style={styles.emptyText}>No expenses logged for {monthLabel} yet.</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
                    Tap &quot;+ Log&quot; next to any category above.
                  </ThemedText>
                </ThemedView>
              )}
            </>
          )}
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.one + 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  modeBtnText: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  modeBtnTextActive: { color: '#000' },

  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: 'rgba(128,128,128,0.3)' },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  over: { color: '#E74C3C' },

  list: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  hint: { fontSize: 12, textAlign: 'center', marginBottom: Spacing.one },
  sectionDivider: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
    gap: Spacing.two,
  },
  catEmoji: { fontSize: 22, width: 30 },
  catInfo: { flex: 1, gap: 1 },
  catName: { fontSize: 15, fontWeight: '600' },
  tapToRename: { fontSize: 10, opacity: 0.5, marginTop: 1 },
  nameInput: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.primary,
    borderBottomWidth: 1.5,
    borderBottomColor: Brand.primary,
    paddingVertical: 2,
    minWidth: 120,
  },
  catAmount: { fontSize: 16, fontWeight: '700', color: Brand.primary },
  unset: { color: Brand.accent, fontWeight: '600' },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
    minWidth: 80,
    textAlign: 'right',
    borderBottomWidth: 2,
    borderBottomColor: Brand.primary,
    paddingVertical: 2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
    gap: Spacing.two,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Brand.tactical + '60',
  },
  addEmoji: { fontSize: 18, width: 30, opacity: 0.5 },
  addInput: { flex: 1, fontSize: 15, color: Brand.tactical },
  addBtn: {
    backgroundColor: Brand.tactical,
    borderRadius: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  maxNote: { textAlign: 'center', fontSize: 12, paddingTop: Spacing.one },
  warningBox: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#E67E22',
  },
  warningText: { fontSize: 13, lineHeight: 20 },

  // Spending mode
  spendRow: {
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
    gap: Spacing.one + 2,
  },
  spendTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logBtn: {
    backgroundColor: Brand.tactical + '22',
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderColor: Brand.tactical + '60',
  },
  logBtnText: { fontSize: 12, fontWeight: '700', color: Brand.tactical },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.border,
    overflow: 'hidden',
  },
  barFill: { height: 4, borderRadius: 2 },
  overText: { fontSize: 11, color: Brand.danger, fontWeight: '600' },

  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one + 2,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  expenseEmoji: { fontSize: 18, width: 28 },
  expenseInfo: { flex: 1, gap: 2 },
  expenseCat: { fontSize: 13, fontWeight: '600' },
  expenseRight: { alignItems: 'flex-end', gap: 2 },
  expenseAmt: { fontSize: 14, fontWeight: '700', color: Brand.primary },

  panel: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.two,
    borderLeftWidth: 3,
    borderLeftColor: Brand.tactical,
    marginBottom: Spacing.one,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  panelClose: { fontSize: 16, color: '#4D7A9A', paddingLeft: Spacing.two },
  panelInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: Brand.border,
    fontSize: 15,
    color: Brand.primary,
    paddingVertical: Spacing.one + 2,
  },
  panelSubmit: {
    backgroundColor: Brand.tactical,
    borderRadius: 4,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  panelSubmitText: { color: '#000', fontSize: 14, fontWeight: '800' },

  emptyBox: {
    borderRadius: Spacing.two,
    padding: Spacing.three + 4,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  emptyText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
