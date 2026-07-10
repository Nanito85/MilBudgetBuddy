import React, { useState, useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(month: number, year: number) {
  return new Date(year, month, 1).getDay();
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  value?: string;
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
  title?: string;
  maxYear?: number;
  minYear?: number;
}

type Mode = 'day' | 'year';

// ── Component ──────────────────────────────────────────────────────────────────

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Select Date',
  maxYear,
  minYear = 1960,
}: Props) {
  const tc = useThemeColors();
  const now = new Date();
  const initYear  = value ? parseInt(value.slice(0, 4), 10) : now.getFullYear();
  const initMonth = value ? parseInt(value.slice(5, 7), 10) - 1 : now.getMonth();
  const initDay   = value ? parseInt(value.slice(8, 10), 10) : now.getDate();

  const [mode,      setMode]      = useState<Mode>('day');
  const [viewYear,  setViewYear]  = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [selYear,   setSelYear]   = useState(initYear);
  const [selMonth,  setSelMonth]  = useState(initMonth);
  const [selDay,    setSelDay]    = useState(initDay);

  const yearScrollRef = useRef<ScrollView>(null);
  const maxYr = maxYear ?? now.getFullYear();
  const years = Array.from({ length: maxYr - minYear + 1 }, (_, i) => maxYr - i);

  useEffect(() => {
    if (visible) {
      const y = value ? parseInt(value.slice(0, 4), 10) : now.getFullYear();
      const m = value ? parseInt(value.slice(5, 7), 10) - 1 : now.getMonth();
      const d = value ? parseInt(value.slice(8, 10), 10) : now.getDate();
      setMode('day');
      setViewYear(y); setViewMonth(m);
      setSelYear(y);  setSelMonth(m); setSelDay(d);
    }
  }, [visible]);

  // Scroll year list to selected year when mode switches
  useEffect(() => {
    if (mode === 'year') {
      const idx = years.indexOf(viewYear);
      if (idx >= 0) {
        setTimeout(() => {
          yearScrollRef.current?.scrollTo({ y: idx * YEAR_ROW_H, animated: false });
        }, 80);
      }
    }
  }, [mode]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear <= minYear) return;
      setViewMonth(11); setViewYear(v => v - 1);
    } else {
      setViewMonth(v => v - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear >= maxYr) return;
      setViewMonth(0); setViewYear(v => v + 1);
    } else {
      setViewMonth(v => v + 1);
    }
  };

  const selectDay = (day: number) => {
    setSelDay(day); setSelMonth(viewMonth); setSelYear(viewYear);
  };

  const selectYear = (y: number) => {
    setViewYear(y);
    setMode('day');
  };

  const confirm = () => {
    const mm = String(selMonth + 1).padStart(2, '0');
    const dd = String(selDay).padStart(2, '0');
    onConfirm(`${selYear}-${mm}-${dd}`);
  };

  // Build day grid
  const totalDays   = daysInMonth(viewMonth, viewYear);
  const startOffset = firstDayOfMonth(viewMonth, viewYear);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) =>
    d === selDay && viewMonth === selMonth && viewYear === selYear;
  const isToday = (d: number) =>
    d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const canGoPrev = !(viewMonth === 0 && viewYear <= minYear);
  const canGoNext = !(viewMonth === 11 && viewYear >= maxYr);

  return (
    <Modal visible={visible} transparent animationType="fade">
      {/* Backdrop */}
      <Pressable
        style={[StyleSheet.absoluteFillObject, s.backdrop]}
        onPress={onCancel}
      />

      {/* Sheet */}
      <View style={s.sheetWrap}>
        <SafeAreaView edges={['bottom']} style={[s.sheet, { backgroundColor: tc.surface }]}>

          {/* Handle */}
          <View style={s.handleRow}>
            <View style={[s.handle, { backgroundColor: tc.borderStrong }]} />
          </View>

          {/* Header */}
          <View style={[s.header, { borderBottomColor: tc.borderColor }]}>
            <Pressable onPress={onCancel} hitSlop={16} style={s.headerSide}>
              <ThemedText style={[s.cancelText, { color: tc.textSecondary }]}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={[s.titleText, { color: tc.textPrimary }]}>{title}</ThemedText>
            <Pressable onPress={confirm} hitSlop={16} style={[s.headerSide, s.headerRight]}>
              <ThemedText style={s.doneText}>Done</ThemedText>
            </Pressable>
          </View>

          {/* ── YEAR PICKER MODE ── */}
          {mode === 'year' && (
            <>
              <View style={s.yearHeader}>
                <ThemedText style={[s.yearHeaderLabel, { color: tc.textMuted }]}>SELECT YEAR</ThemedText>
                <Pressable onPress={() => setMode('day')} hitSlop={12}>
                  <ThemedText style={s.yearHeaderBack}>↩ Back</ThemedText>
                </Pressable>
              </View>
              <ScrollView
                ref={yearScrollRef}
                style={s.yearList}
                showsVerticalScrollIndicator={false}
              >
                {years.map((y) => {
                  const isCurrentView = y === viewYear;
                  return (
                    <Pressable
                      key={y}
                      onPress={() => selectYear(y)}
                      style={({ pressed }) => [
                        s.yearRow,
                        isCurrentView && s.yearRowSelected,
                        pressed && !isCurrentView && { backgroundColor: tc.surfaceInner },
                      ]}>
                      <ThemedText style={[
                        s.yearRowText,
                        { color: tc.textSecondary },
                        isCurrentView && s.yearRowTextSelected,
                      ]}>
                        {y}
                      </ThemedText>
                      {isCurrentView && <ThemedText style={s.yearCheck}>✓</ThemedText>}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* ── DAY PICKER MODE ── */}
          {mode === 'day' && (
            <>
              {/* Month / Year navigation */}
              <View style={s.navRow}>
                <Pressable
                  onPress={prevMonth}
                  disabled={!canGoPrev}
                  hitSlop={12}
                  style={[s.navBtn, !canGoPrev && s.navBtnDisabled]}>
                  <ThemedText style={[s.navArrow, !canGoPrev && { color: tc.textMuted }]}>‹</ThemedText>
                </Pressable>

                {/* Tap label to open year picker */}
                <Pressable onPress={() => setMode('year')} style={s.navLabelBtn} hitSlop={8}>
                  <ThemedText style={[s.navLabel, { color: tc.textPrimary }]}>
                    {MONTH_NAMES[viewMonth]}  {viewYear}
                  </ThemedText>
                  <ThemedText style={s.navLabelChevron}>▾</ThemedText>
                </Pressable>

                <Pressable
                  onPress={nextMonth}
                  disabled={!canGoNext}
                  hitSlop={12}
                  style={[s.navBtn, !canGoNext && s.navBtnDisabled]}>
                  <ThemedText style={[s.navArrow, !canGoNext && { color: tc.textMuted }]}>›</ThemedText>
                </Pressable>
              </View>

              {/* Day-of-week labels */}
              <View style={s.weekRow}>
                {DAY_LABELS.map((d) => (
                  <ThemedText key={d} style={[s.weekLabel, { color: tc.textMuted }]}>{d}</ThemedText>
                ))}
              </View>

              {/* Day grid */}
              <View style={s.grid}>
                {cells.map((day, idx) => {
                  if (day === null) return <View key={`e-${idx}`} style={s.cell} />;
                  const selected = isSelected(day);
                  const today    = isToday(day);
                  return (
                    <Pressable
                      key={`d-${day}`}
                      onPress={() => selectDay(day)}
                      style={({ pressed }) => [
                        s.cell,
                        selected && s.cellSelected,
                        !selected && today && s.cellToday,
                        pressed && !selected && s.cellPressed,
                      ]}>
                      <ThemedText style={[
                        s.cellText,
                        { color: tc.textSecondary },
                        selected && s.cellTextSelected,
                        !selected && today && s.cellTextToday,
                      ]}>
                        {day}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Preview */}
              <View style={[s.preview, { borderTopColor: tc.borderColor }]}>
                <ThemedText style={[s.previewText, { color: tc.textHint }]}>
                  {MONTH_NAMES[selMonth]} {selDay}, {selYear}
                </ThemedText>
              </View>
            </>
          )}

        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const CELL_SIZE  = 42;
const YEAR_ROW_H = 48;

const s = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },

  sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },

  handleRow: { alignItems: 'center', paddingTop: Spacing.two, paddingBottom: Spacing.one },
  handle: { width: 40, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  headerSide: { minWidth: 64 },
  headerRight: { alignItems: 'flex-end' },
  titleText:  { fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  cancelText: { fontSize: 14 },
  doneText:   { fontSize: 14, fontWeight: '800', color: Brand.tactical },

  // Year picker
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  yearHeaderLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  yearHeaderBack:  { fontSize: 13, color: Brand.tactical, fontWeight: '700' },
  yearList: { maxHeight: YEAR_ROW_H * 6 },
  yearRow: {
    height: YEAR_ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 1,
  },
  yearRowSelected: { backgroundColor: Brand.tactical + '20' },
  yearRowText:         { fontSize: 22, fontWeight: '400' },
  yearRowTextSelected: { fontSize: 24, fontWeight: '800', color: Brand.tactical },
  yearCheck: { position: 'absolute', right: Spacing.three, color: Brand.tactical, fontSize: 16 },

  // Day picker nav
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  navBtn:         { padding: Spacing.one },
  navBtnDisabled: { opacity: 0.2 },
  navArrow:         { fontSize: 28, fontWeight: '300', color: Brand.tactical, lineHeight: 32 },
  navLabelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  navLabelChevron: { fontSize: 12, color: Brand.tactical, marginTop: 2 },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%` as any,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: Brand.tactical, borderRadius: CELL_SIZE / 2 },
  cellToday:    { borderWidth: 1, borderColor: Brand.tactical + '80', borderRadius: CELL_SIZE / 2 },
  cellPressed:  { backgroundColor: Brand.tactical + '20', borderRadius: CELL_SIZE / 2 },
  cellText:         { fontSize: 15, fontWeight: '500' },
  cellTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  cellTextToday:    { color: Brand.tactical, fontWeight: '700' },

  preview: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
});
