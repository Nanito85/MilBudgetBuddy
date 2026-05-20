import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { calcLES, fmtPay } from '@/features/home/utils/lesCalc';
import {
  BudgetCategory,
  CUSTOM_PREFIX,
  MAX_CUSTOM_CATEGORIES,
  useBudgetStore,
} from '@/store/budget.store';
import { currentMonthKey, Expense, useExpensesStore } from '@/store/expenses.store';
import {
  GOAL_CATEGORY_META,
  GoalCategory,
  SavingsGoal,
  useSavingsGoalsStore,
} from '@/store/savings-goals.store';
import { useUserStore } from '@/store/user.store';

// ── Military savings tips ──────────────────────────────────────────────────────

const MIL_TIPS = [
  {
    id: 't1',
    icon: '🛡️',
    title: 'Emergency Fund First',
    body: 'Build 3–6 months of expenses before anything else. Military life brings PCS moves, ETS, and unexpected costs. Your emergency fund is your financial body armor.',
  },
  {
    id: 't2',
    icon: '📊',
    title: 'TSP Match = Free Money',
    body: 'Under BRS, the government matches up to 5% of base pay in your TSP. Not contributing at least 5% means leaving part of your compensation on the table every single month.',
  },
  {
    id: 't3',
    icon: '🏠',
    title: 'Make BAH Work For You',
    body: 'BAH is tax-free. If your rent is less than your BAH rate, the difference is yours to keep. Living below your BAH means you are turning a housing allowance into an investment.',
  },
  {
    id: 't4',
    icon: '✈️',
    title: 'Deploy to Save Aggressively',
    body: 'CZTE (Combat Zone Tax Exclusion) makes all pay tax-free during deployment. Combined with no housing costs, a 6-month deployment can be worth $15,000–$30,000+ in savings if you have a plan.',
  },
  {
    id: 't5',
    icon: '💳',
    title: 'The 50/30/20 Rule (Military Edition)',
    body: 'Aim for: 50% on needs (rent, food, bills), 20% on savings and debt payoff, 30% on wants. For junior enlisted, flip it — push savings to 30% while you have low expenses and guaranteed pay.',
  },
  {
    id: 't6',
    icon: '🎯',
    title: 'Automate Everything',
    body: 'Set up automatic TSP contributions, automatic Roth IRA transfers on payday, and automatic savings transfers. "Pay yourself first" works best when you never see the money in your checking account.',
  },
  {
    id: 't7',
    icon: '🚗',
    title: 'Avoid the Car Trap',
    body: 'The most common way service members destroy their finances is buying too much car on credit. A $600/month car payment on an E-4 salary is a financial own-goal. Keep payments under 15% of take-home pay.',
  },
  {
    id: 't8',
    icon: '📈',
    title: 'Compound Interest Is Your Ally',
    body: 'Investing $200/month starting at age 18 beats investing $500/month starting at age 30 — even though the late starter puts in more total. Start early, stay consistent, never stop.',
  },
  {
    id: 't9',
    icon: '⚖️',
    title: 'SCRA Caps Old Debt at 6%',
    body: 'The Servicemembers Civil Relief Act limits interest on debts you had before activation to 6% APR. Submit a written request with a copy of your orders to each lender. This is your right by federal law.',
  },
  {
    id: 't10',
    icon: '🏁',
    title: 'Know Your Retirement System',
    body: 'High-3: full pension after 20 years, no TSP match. BRS: smaller pension but government TSP matching. Knowing which system you are in changes your entire savings strategy. Check your PEBD.',
  },
];

// ── CUSTOM_EMOJIS ──────────────────────────────────────────────────────────────
const CUSTOM_EMOJIS = ['📦', '🎯', '🛍️', '🔧', '🏋️', '🐾', '🎓', '💊', '✈️', '🏡'];

// ── Budget allocation row ──────────────────────────────────────────────────────

function CategoryRow({ cat, netPay }: { cat: BudgetCategory; netPay: number }) {
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [amountVal, setAmountVal] = useState(cat.monthlyBudget > 0 ? String(cat.monthlyBudget) : '');
  const [nameVal, setNameVal] = useState(cat.name);
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const removeCategory = useBudgetStore((s) => s.removeCategory);
  const isCustom = cat.id.startsWith(CUSTOM_PREFIX);

  const pct =
    netPay > 0 && cat.monthlyBudget > 0
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
              style={styles.nameInput}
              placeholder="Category name"
              returnKeyType="done"
            />
          ) : (
            <Pressable
              onPress={
                isCustom
                  ? () => {
                      setNameVal(cat.name);
                      setEditingName(true);
                    }
                  : undefined
              }>
              <ThemedText style={styles.catName}>{cat.name}</ThemedText>
            </Pressable>
          )}
          {pct !== null && !editingName && (
            <ThemedText type="small" themeColor="textSecondary">
              {pct}% of net pay
            </ThemedText>
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
          <Pressable
            onPress={() => {
              setAmountVal(cat.monthlyBudget > 0 ? String(cat.monthlyBudget) : '');
              setEditingAmount(true);
            }}>
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

// ── Spending tracker row ───────────────────────────────────────────────────────

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
  const barColor = over
    ? Brand.danger
    : spent / (budget || 1) > 0.8
    ? Brand.warning
    : Brand.tactical;

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
        <Pressable
          onPress={() => onAddExpense(cat.id, cat.name, cat.emoji)}
          style={styles.logBtn}>
          <ThemedText style={styles.logBtnText}>+ Log</ThemedText>
        </Pressable>
      </View>
      {budget > 0 && (
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]}
          />
        </View>
      )}
      {over && (
        <ThemedText style={styles.overText}>Over by {fmtPay(spent - budget)}</ThemedText>
      )}
    </ThemedView>
  );
}

// ── Recent expenses list ───────────────────────────────────────────────────────

function ExpenseItem({
  expense,
  catName,
  catEmoji,
}: {
  expense: Expense;
  catName: string;
  catEmoji: string;
}) {
  const removeExpense = useExpensesStore((s) => s.removeExpense);

  const handleLongPress = () => {
    Alert.alert('Delete Expense', `Remove $${expense.amount.toFixed(2)} from ${catName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeExpense(expense.id),
      },
    ]);
  };

  const dateLabel = new Date(expense.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable onLongPress={handleLongPress}>
      <View style={styles.expenseItem}>
        <ThemedText style={styles.expenseEmoji}>{catEmoji}</ThemedText>
        <View style={styles.expenseInfo}>
          <ThemedText style={styles.expenseCat}>{catName}</ThemedText>
          {expense.note ? (
            <ThemedText type="small" themeColor="textSecondary">
              {expense.note}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.expenseRight}>
          <ThemedText style={styles.expenseAmt}>{fmtPay(expense.amount)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {dateLabel}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

// ── Add Expense panel ──────────────────────────────────────────────────────────

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
        <ThemedText style={styles.panelTitle}>
          {catEmoji} Log Expense — {catName}
        </ThemedText>
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

// ── Savings tip card ───────────────────────────────────────────────────────────

function TipRotator() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * MIL_TIPS.length));
  const tip = MIL_TIPS[idx];

  const next = () => setIdx((i) => (i + 1) % MIL_TIPS.length);
  const prev = () => setIdx((i) => (i - 1 + MIL_TIPS.length) % MIL_TIPS.length);

  return (
    <View style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <ThemedText style={styles.tipLabel}>// FIN-OPS INTEL</ThemedText>
        <View style={styles.tipNav}>
          <Pressable onPress={prev} hitSlop={8} style={styles.tipNavBtn}>
            <ThemedText style={styles.tipNavText}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.tipCounter}>
            {idx + 1}/{MIL_TIPS.length}
          </ThemedText>
          <Pressable onPress={next} hitSlop={8} style={styles.tipNavBtn}>
            <ThemedText style={styles.tipNavText}>›</ThemedText>
          </Pressable>
        </View>
      </View>
      <View style={styles.tipBody}>
        <ThemedText style={styles.tipIcon}>{tip.icon}</ThemedText>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
          <ThemedText style={styles.tipText}>{tip.body}</ThemedText>
        </View>
      </View>
    </View>
  );
}

// ── Goals mode ─────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onDeposit,
  onWithdraw,
  onDelete,
}: {
  goal: SavingsGoal;
  onDeposit: () => void;
  onWithdraw: () => void;
  onDelete: () => void;
}) {
  const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
  const done = pct >= 1;

  const handleLongPress = () => {
    Alert.alert('Delete Goal', `Remove "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Pressable onLongPress={handleLongPress}>
      <ThemedView type="backgroundElement" style={[styles.goalCard, done && styles.goalCardDone]}>
        <View style={[styles.goalAccent, { backgroundColor: goal.color }]} />
        <View style={styles.goalContent}>
          <View style={styles.goalTop}>
            <ThemedText style={styles.goalEmoji}>{goal.emoji}</ThemedText>
            <View style={styles.goalInfo}>
              <ThemedText style={styles.goalName}>{goal.name.toUpperCase()}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {fmtPay(goal.currentAmount)} of {fmtPay(goal.targetAmount)}
                {done ? '  ✓ COMPLETE' : ''}
              </ThemedText>
            </View>
            <ThemedText style={[styles.goalPct, { color: done ? Brand.success : goal.color }]}>
              {Math.round(pct * 100)}%
            </ThemedText>
          </View>
          <View style={styles.goalBarTrack}>
            <View
              style={[
                styles.goalBarFill,
                { width: `${pct * 100}%` as any, backgroundColor: done ? Brand.success : goal.color },
              ]}
            />
          </View>
          <View style={styles.goalActions}>
            <Pressable onPress={onDeposit} style={[styles.goalBtn, { borderColor: goal.color + '60' }]}>
              <ThemedText style={[styles.goalBtnText, { color: goal.color }]}>+ Deposit</ThemedText>
            </Pressable>
            <Pressable
              onPress={onWithdraw}
              style={[styles.goalBtn, { borderColor: Brand.border }]}>
              <ThemedText style={[styles.goalBtnText, { color: '#6B92B0' }]}>− Withdraw</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

function AmountModal({
  title,
  visible,
  onClose,
  onSubmit,
  submitLabel,
  submitColor,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  submitLabel: string;
  submitColor: string;
}) {
  const [val, setVal] = useState('');

  const handleSubmit = () => {
    const n = parseFloat(val);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Invalid', 'Enter a positive dollar amount.');
      return;
    }
    onSubmit(n);
    setVal('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <ThemedText style={styles.modalTitle}>{title}</ThemedText>
          <TextInput
            value={val}
            onChangeText={setVal}
            placeholder="Amount ($)"
            placeholderTextColor="rgba(128,128,128,0.5)"
            keyboardType="decimal-pad"
            autoFocus
            style={styles.modalInput}
          />
          <View style={styles.modalBtns}>
            <Pressable onPress={onClose} style={styles.modalCancelBtn}>
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable onPress={handleSubmit} style={[styles.modalSubmitBtn, { backgroundColor: submitColor }]}>
              <ThemedText style={styles.modalSubmitText}>{submitLabel}</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddGoalModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const addGoal = useSavingsGoalsStore((s) => s.addGoal);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState<GoalCategory>('emergency');

  const CATS = Object.entries(GOAL_CATEGORY_META) as [GoalCategory, typeof GOAL_CATEGORY_META[GoalCategory]][];

  const submit = () => {
    const trimmed = name.trim();
    const n = parseFloat(target);
    if (!trimmed) {
      Alert.alert('Missing Name', 'Give your goal a name.');
      return;
    }
    if (isNaN(n) || n <= 0) {
      Alert.alert('Invalid Target', 'Enter a target amount greater than $0.');
      return;
    }
    const meta = GOAL_CATEGORY_META[category];
    addGoal(trimmed, meta.emoji, category, n);
    setName('');
    setTarget('');
    setCategory('emergency');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { maxHeight: '85%' }]}>
          <ThemedText style={styles.modalTitle}>New Savings Goal</ThemedText>

          <ThemedText style={styles.fieldLabel}>GOAL NAME</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Emergency Fund"
            placeholderTextColor="rgba(128,128,128,0.5)"
            style={styles.modalInput}
            returnKeyType="next"
          />

          <ThemedText style={[styles.fieldLabel, { marginTop: Spacing.two }]}>TARGET AMOUNT</ThemedText>
          <TextInput
            value={target}
            onChangeText={setTarget}
            placeholder="$0"
            placeholderTextColor="rgba(128,128,128,0.5)"
            keyboardType="decimal-pad"
            style={styles.modalInput}
          />

          <ThemedText style={[styles.fieldLabel, { marginTop: Spacing.two }]}>CATEGORY</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.two }}
            contentContainerStyle={{ gap: Spacing.one, paddingVertical: Spacing.one }}>
            {CATS.map(([key, meta]) => (
              <Pressable
                key={key}
                onPress={() => setCategory(key)}
                style={[
                  styles.catChip,
                  category === key && { backgroundColor: meta.color + '30', borderColor: meta.color },
                ]}>
                <ThemedText style={styles.catChipEmoji}>{meta.emoji}</ThemedText>
                <ThemedText
                  style={[styles.catChipText, category === key && { color: meta.color }]}>
                  {meta.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.modalBtns}>
            <Pressable onPress={onClose} style={styles.modalCancelBtn}>
              <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={submit}
              style={[styles.modalSubmitBtn, { backgroundColor: GOAL_CATEGORY_META[category].color }]}>
              <ThemedText style={styles.modalSubmitText}>Create Goal</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GoalsMode() {
  const goals = useSavingsGoalsStore((s) => s.goals);
  const deposit = useSavingsGoalsStore((s) => s.deposit);
  const withdraw = useSavingsGoalsStore((s) => s.withdraw);
  const removeGoal = useSavingsGoalsStore((s) => s.removeGoal);

  const [addVisible, setAddVisible] = useState(false);
  const [depositTarget, setDepositTarget] = useState<string | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completedCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

  return (
    <>
      {/* Summary */}
      {goals.length > 0 && (
        <ThemedView type="backgroundElement" style={styles.goalsSummary}>
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Total Saved</ThemedText>
            <ThemedText style={styles.summaryValue}>{fmtPay(totalSaved)}</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Total Target</ThemedText>
            <ThemedText style={styles.summaryValue}>{fmtPay(totalTarget)}</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Completed</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: Brand.success }]}>
              {completedCount}/{goals.length}
            </ThemedText>
          </View>
        </ThemedView>
      )}

      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        {goals.length === 0
          ? 'Set a savings goal and track your progress. Long-press a goal to delete.'
          : 'Tap Deposit to add funds. Long-press a goal to delete.'}
      </ThemedText>

      {goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          onDeposit={() => setDepositTarget(g.id)}
          onWithdraw={() => setWithdrawTarget(g.id)}
          onDelete={() => removeGoal(g.id)}
        />
      ))}

      {/* Add goal button */}
      <Pressable onPress={() => setAddVisible(true)} style={styles.addGoalBtn}>
        <ThemedText style={styles.addGoalBtnText}>+ NEW SAVINGS GOAL</ThemedText>
      </Pressable>

      {/* Military savings tips */}
      <TipRotator />

      {/* Modals */}
      <AddGoalModal visible={addVisible} onClose={() => setAddVisible(false)} />
      <AmountModal
        title="Deposit to Goal"
        visible={!!depositTarget}
        onClose={() => setDepositTarget(null)}
        onSubmit={(n) => depositTarget && deposit(depositTarget, n)}
        submitLabel="Deposit"
        submitColor={Brand.success}
      />
      <AmountModal
        title="Withdraw from Goal"
        visible={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onSubmit={(n) => withdrawTarget && withdraw(withdrawTarget, n)}
        submitLabel="Withdraw"
        submitColor={Brand.warning}
      />
    </>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

type Mode = 'budget' | 'spending' | 'goals';

export default function BudgetScreen() {
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
    useSavingsGoalsStore.getState().hydrate();
  }, []);

  const netPay = React.useMemo(() => {
    if (!payGrade) return 0;
    const specialPaysTotal = specialPays.reduce((s: number, p: any) => s + p.monthlyAmount, 0);
    return calcLES({
      payGrade,
      yos,
      mhaZip,
      hasSpouse,
      specialPaysTotal,
      tspContribPct,
      hasDentalFamily,
      sglOptOut,
    }).netPay;
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

  const monthLabel = new Date(mk + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <ThemedText style={styles.headerEyebrow}>// FINANCE OPS</ThemedText>
          <ThemedText style={styles.title}>BUDGET HQ</ThemedText>
        </View>

        {/* Mode toggle — 3 tabs */}
        <View style={styles.modeRow}>
          {(['budget', 'spending', 'goals'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeBtn, mode === m && styles.modeBtnActive]}>
              <ThemedText style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                {m === 'budget' ? 'BUDGET' : m === 'spending' ? 'SPENDING' : 'GOALS'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Summary bar — budget & spending modes */}
        {mode !== 'goals' && (
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
                  <ThemedText
                    style={[styles.summaryValue, totalSpent > totalBudgeted && styles.over]}>
                    {fmtPay(totalSpent)}
                  </ThemedText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <ThemedText type="small" themeColor="textSecondary">Left</ThemedText>
                  <ThemedText
                    style={[styles.summaryValue, totalSpent > totalBudgeted && styles.over]}>
                    {totalSpent > totalBudgeted
                      ? `-${fmtPay(totalSpent - totalBudgeted)}`
                      : fmtPay(totalBudgeted - totalSpent)}
                  </ThemedText>
                </View>
              </>
            )}
          </ThemedView>
        )}

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">

          {/* ── BUDGET MODE ── */}
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
                    ⚠ You&apos;ve budgeted {fmtPay(Math.abs(remaining))} more than your estimated
                    net pay. Adjust your categories to balance your budget.
                  </ThemedText>
                </ThemedView>
              )}

              {/* Tips at bottom of budget mode */}
              <TipRotator />
            </>
          )}

          {/* ── SPENDING MODE ── */}
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

              {allExpenses.length > 0 && (
                <>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={[styles.sectionDivider, { marginTop: Spacing.three }]}>
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
                  <ThemedText style={styles.emptyText}>
                    No expenses logged for {monthLabel} yet.
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={{ marginTop: Spacing.one }}>
                    Tap &quot;+ Log&quot; next to any category above.
                  </ThemedText>
                </ThemedView>
              )}
            </>
          )}

          {/* ── GOALS MODE ── */}
          {mode === 'goals' && <GoalsMode />}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Brand.tactical,
    fontFamily: 'monospace',
  },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: 0.5, color: '#C8D8E8' },

  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.one + 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  modeBtnText: { fontSize: 10, fontWeight: '800', color: '#6B92B0', letterSpacing: 0.5 },
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
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(128,128,128,0.3)',
  },
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
  barTrack: { height: 4, borderRadius: 2, backgroundColor: Brand.border, overflow: 'hidden' },
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

  // Tips
  tipCard: {
    backgroundColor: '#050B14',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.tactical + '40',
    borderRadius: 4,
    padding: Spacing.three,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Brand.tactical,
    fontFamily: 'monospace',
  },
  tipNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  tipNavBtn: { paddingHorizontal: Spacing.one },
  tipNavText: { fontSize: 20, color: Brand.tactical, lineHeight: 24 },
  tipCounter: { fontSize: 10, color: '#3D6080', fontWeight: '700' },
  tipBody: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  tipIcon: { fontSize: 24, lineHeight: 30 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', marginBottom: 4 },
  tipText: { fontSize: 12, lineHeight: 18, color: '#6B92B0' },

  // Goals mode
  goalsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.one,
  },
  goalCard: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    overflow: 'hidden',
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
  },
  goalCardDone: { borderColor: Brand.success + '40' },
  goalAccent: { width: 3, alignSelf: 'stretch' },
  goalContent: { flex: 1, padding: Spacing.two + 4, gap: Spacing.one + 2 },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  goalEmoji: { fontSize: 22, lineHeight: 28 },
  goalInfo: { flex: 1, gap: 2 },
  goalName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: '#C8D8E8' },
  goalPct: { fontSize: 16, fontWeight: '900' },
  goalBarTrack: { height: 5, borderRadius: 3, backgroundColor: Brand.border, overflow: 'hidden' },
  goalBarFill: { height: 5, borderRadius: 3 },
  goalActions: { flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.one },
  goalBtn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  goalBtnText: { fontSize: 11, fontWeight: '700' },

  addGoalBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Brand.accent + '60',
    borderRadius: 4,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  addGoalBtnText: { fontSize: 12, fontWeight: '800', color: Brand.accent, letterSpacing: 0.5 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  modalCard: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 8,
    padding: Spacing.three + 4,
    width: '100%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#C8D8E8', marginBottom: Spacing.two },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#3D6080',
    marginBottom: Spacing.one,
    fontFamily: 'monospace',
  },
  modalInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: Brand.border,
    fontSize: 15,
    color: '#C8D8E8',
    paddingVertical: Spacing.one + 2,
    marginBottom: Spacing.two,
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 4,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  modalCancelText: { color: '#4D7A9A', fontWeight: '700', fontSize: 13 },
  modalSubmitBtn: {
    flex: 1,
    borderRadius: 4,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  modalSubmitText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: '#050B14',
  },
  catChipEmoji: { fontSize: 14, lineHeight: 18 },
  catChipText: { fontSize: 11, fontWeight: '600', color: '#4D7A9A' },
});
