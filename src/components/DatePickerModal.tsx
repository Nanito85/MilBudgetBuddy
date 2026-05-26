import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { Brand, Spacing } from '@/constants/theme';

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEM_H = 48;
const VISIBLE = 5; // visible rows in the drum (must be odd)
const PAD = Math.floor(VISIBLE / 2); // blank spacer rows on each side

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function buildYears(): number[] {
  const now = new Date().getFullYear();
  const arr: number[] = [];
  for (let y = now; y >= 1960; y--) arr.push(y);
  return arr;
}

// ── Drum Column ────────────────────────────────────────────────────────────────

function DrumColumn({
  items,
  selected,
  onChange,
  label,
  flex,
}: {
  items: (string | number)[];
  selected: string | number;
  onChange: (v: string | number) => void;
  label: string;
  flex?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const selIdx = items.indexOf(selected);

  useEffect(() => {
    if (selIdx >= 0) {
      // Delay to let layout settle before scrolling
      setTimeout(() => {
        ref.current?.scrollTo({ y: selIdx * ITEM_H, animated: false });
      }, 80);
    }
  }, []);

  const handleScrollEnd = (y: number) => {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_H)));
    onChange(items[idx]);
  };

  return (
    <View style={[drum.col, flex != null && { flex }]}>
      <ThemedText style={drum.colLabel}>{label}</ThemedText>
      <View style={drum.drumWrap}>
        {/* Selection highlight */}
        <View pointerEvents="none" style={drum.highlight} />

        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: PAD * ITEM_H }}
          onMomentumScrollEnd={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => handleScrollEnd(e.nativeEvent.contentOffset.y)}
          style={{ height: ITEM_H * VISIBLE }}
        >
          {items.map((item) => (
            <View key={String(item)} style={drum.item}>
              <ThemedText
                style={[
                  drum.itemText,
                  String(item) === String(selected) && drum.selectedText,
                ]}
                numberOfLines={1}
              >
                {item}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  value?: string; // YYYY-MM-DD
  onConfirm: (isoDate: string) => void;
  onCancel: () => void;
  title?: string;
  maxYear?: number;
  minYear?: number;
}

export function DatePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Select Date',
  maxYear,
  minYear = 1960,
}: Props) {
  const now = new Date();
  const parsedYear = value ? parseInt(value.slice(0, 4), 10) : now.getFullYear();
  const parsedMonth = value ? parseInt(value.slice(5, 7), 10) : now.getMonth() + 1;
  const parsedDay = value ? parseInt(value.slice(8, 10), 10) : now.getDate();

  const [year, setYear] = useState(parsedYear);
  const [month, setMonth] = useState(parsedMonth); // 1-12
  const [day, setDay] = useState(parsedDay);

  // Reset state when modal opens with new value
  useEffect(() => {
    if (visible) {
      const y = value ? parseInt(value.slice(0, 4), 10) : now.getFullYear();
      const m = value ? parseInt(value.slice(5, 7), 10) : now.getMonth() + 1;
      const d = value ? parseInt(value.slice(8, 10), 10) : now.getDate();
      setYear(y);
      setMonth(m);
      setDay(Math.min(d, daysInMonth(m, y)));
    }
  }, [visible]);

  // Clamp day when month/year changes
  useEffect(() => {
    const max = daysInMonth(month, year);
    if (day > max) setDay(max);
  }, [month, year]);

  const topYear = maxYear ?? now.getFullYear();
  const years = buildYears().filter((y) => y >= minYear && y <= topYear);
  const months = MONTH_SHORT.map((_, i) => `${i + 1}`.padStart(2, '0') + ' ' + MONTH_SHORT[i]);
  const days = Array.from({ length: daysInMonth(month, year) }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  );

  const selectedMonth = `${String(month).padStart(2, '0')} ${MONTH_SHORT[month - 1]}`;
  const selectedDay = String(day).padStart(2, '0');

  const confirm = () => {
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onConfirm(iso);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={overlay.backdrop} onPress={onCancel} />
      <View style={overlay.container}>
        <SafeAreaView edges={['bottom']} style={overlay.sheet}>
          {/* Header */}
          <View style={overlay.header}>
            <Pressable onPress={onCancel} hitSlop={12}>
              <ThemedText style={overlay.cancel}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={overlay.title}>{title}</ThemedText>
            <Pressable onPress={confirm} hitSlop={12}>
              <ThemedText style={overlay.confirm}>Done</ThemedText>
            </Pressable>
          </View>

          {/* Drum columns */}
          <View style={drum.row}>
            <DrumColumn
              flex={2}
              label="MONTH"
              items={months}
              selected={selectedMonth}
              onChange={(v) => {
                const idx = months.indexOf(v as string);
                if (idx >= 0) setMonth(idx + 1);
              }}
            />
            <DrumColumn
              flex={1}
              label="DAY"
              items={days}
              selected={selectedDay}
              onChange={(v) => setDay(parseInt(v as string, 10))}
            />
            <DrumColumn
              flex={1}
              label="YEAR"
              items={years}
              selected={year}
              onChange={(v) => setYear(v as number)}
            />
          </View>

          {/* Preview */}
          <View style={overlay.preview}>
            <ThemedText style={overlay.previewText}>
              {`${MONTH_LABELS[month - 1]} ${day}, ${year}`}
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const overlay = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#050C18',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#C8D8E8' },
  cancel: { fontSize: 15, color: '#6B92B0' },
  confirm: { fontSize: 15, fontWeight: '700', color: Brand.tactical },
  preview: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: Spacing.one,
  },
  previewText: { fontSize: 13, color: '#6B92B0', fontWeight: '600' },
});

const drum = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  col: { alignItems: 'center', gap: Spacing.one },
  colLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3D6080',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  drumWrap: { position: 'relative' },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PAD * ITEM_H,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Brand.primary + '60',
    backgroundColor: Brand.primary + '10',
    zIndex: 1,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4D7A9A',
    textAlign: 'center',
  },
  selectedText: {
    color: '#C8D8E8',
    fontWeight: '700',
    fontSize: 17,
  },
});
