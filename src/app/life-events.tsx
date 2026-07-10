import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { LIFE_EVENTS, LifeEventType } from '@/data/life-event-checklists';
import { useThemeColors } from '@/hooks/use-theme';
import { useLifeEventsStore } from '@/store/life-events.store';

const ALL_TYPES = Object.keys(LIFE_EVENTS) as LifeEventType[];

export default function LifeEventsScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const { events, activateEvent, dismissEvent, toggleItem, removeEvent } = useLifeEventsStore();
  const [tab, setTab] = useState<'active' | 'browse'>('active');
  const [previewType, setPreviewType] = useState<LifeEventType | null>(null);

  const activeEvents = events.filter((e) => !e.dismissed);
  const dismissedEvents = events.filter((e) => e.dismissed);

  const handleActivate = (type: LifeEventType) => {
    const existing = events.find((e) => e.type === type);
    if (existing && !existing.dismissed) {
      Alert.alert('Already Active', 'This life event is already in your active list.');
      return;
    }
    activateEvent(type);
    setPreviewType(null);
    setTab('active');
  };

  const handleRemove = (type: LifeEventType) => {
    const meta = LIFE_EVENTS[type];
    Alert.alert(
      'Remove Life Event',
      `Remove ${meta.title} and all checklist progress?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeEvent(type) },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
          <ThemedText style={[styles.pageTitle, { color: tc.textPrimary }]}>LIFE EVENTS</ThemedText>
          <ThemedText style={[styles.pageSub, { color: tc.textSecondary }]}>
            Track military life milestones and never miss a critical financial or admin task.
          </ThemedText>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { borderBottomColor: tc.borderColor }]}>
          <Pressable
            style={[styles.tab, tab === 'active' && styles.tabActive]}
            onPress={() => setTab('active')}>
            <ThemedText style={[styles.tabText, { color: tc.textMuted }, tab === 'active' && styles.tabTextActive]}>
              ACTIVE {activeEvents.length > 0 ? `(${activeEvents.length})` : ''}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, tab === 'browse' && styles.tabActive]}
            onPress={() => setTab('browse')}>
            <ThemedText style={[styles.tabText, { color: tc.textMuted }, tab === 'browse' && styles.tabTextActive]}>
              BROWSE ALL
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {tab === 'active' ? (
            <>
              {activeEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyIcon}>📋</ThemedText>
                  <ThemedText style={[styles.emptyTitle, { color: tc.textPrimary }]}>No active life events</ThemedText>
                  <ThemedText style={[styles.emptySub, { color: tc.textSecondary }]}>
                    Browse all events and activate the ones that apply to you.
                  </ThemedText>
                  <Pressable onPress={() => setTab('browse')} style={styles.browseBtn}>
                    <ThemedText style={styles.browseBtnText}>BROWSE EVENTS</ThemedText>
                  </Pressable>
                </View>
              ) : (
                activeEvents.map((activeEvent) => {
                  const meta = LIFE_EVENTS[activeEvent.type];
                  const total = meta.checklist.length;
                  const done = activeEvent.completedItems.length;
                  const pct = total > 0 ? done / total : 0;

                  return (
                    <View key={activeEvent.type} style={[styles.eventCard, { backgroundColor: tc.surface, borderColor: tc.borderColor, borderLeftColor: meta.color }]}>
                      {/* Card header */}
                      <View style={styles.eventCardHeader}>
                        <ThemedText style={styles.eventIcon}>{meta.icon}</ThemedText>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={[styles.eventTitle, { color: tc.textPrimary }]}>{meta.title}</ThemedText>
                          <ThemedText style={[styles.eventProgress, { color: tc.textSecondary }]}>
                            {done}/{total} tasks complete
                          </ThemedText>
                        </View>
                        <Pressable onPress={() => handleRemove(activeEvent.type)} style={styles.removeBtn}>
                          <ThemedText style={[styles.removeBtnText, { color: tc.textSecondary }]}>✕</ThemedText>
                        </Pressable>
                      </View>

                      {/* Progress bar */}
                      <View style={[styles.progressTrack, { backgroundColor: tc.surfaceInner }]}>
                        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: meta.color }]} />
                      </View>

                      {/* Checklist */}
                      <View style={styles.checklist}>
                        {meta.checklist.map((item) => {
                          const checked = activeEvent.completedItems.includes(item.id);
                          return (
                            <Pressable
                              key={item.id}
                              style={styles.checkItem}
                              onPress={() => toggleItem(activeEvent.type, item.id)}>
                              <View style={[styles.checkbox, { borderColor: tc.borderColor }, checked && { backgroundColor: meta.color, borderColor: meta.color }]}>
                                {checked && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                              </View>
                              <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.checkLabel, { color: tc.textPrimary }, checked && [styles.checkLabelDone, { color: tc.textMuted }]]}>
                                  {item.label}
                                </ThemedText>
                                <ThemedText style={[styles.checkCategory, { color: tc.textMuted }]}>{item.category.toUpperCase()}</ThemedText>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>

                      {done === total && (
                        <View style={styles.completeBanner}>
                          <ThemedText style={[styles.completeText, { color: meta.color }]}>
                            ✓ ALL TASKS COMPLETE
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              {dismissedEvents.length > 0 && (
                <View style={styles.dismissedSection}>
                  <ThemedText style={[styles.dismissedLabel, { color: tc.textMuted }]}>DISMISSED</ThemedText>
                  {dismissedEvents.map((e) => {
                    const meta = LIFE_EVENTS[e.type];
                    return (
                      <Pressable
                        key={e.type}
                        style={[styles.dismissedRow, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}
                        onPress={() => activateEvent(e.type)}>
                        <ThemedText style={styles.dismissedIcon}>{meta.icon}</ThemedText>
                        <ThemedText style={[styles.dismissedTitle, { color: tc.textMuted }]}>{meta.title}</ThemedText>
                        <ThemedText style={styles.reactivateText}>Reactivate</ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            /* Browse all events */
            ALL_TYPES.map((type) => {
              const meta = LIFE_EVENTS[type];
              const isActive = events.some((e) => e.type === type && !e.dismissed);
              const isOpen = previewType === type;

              return (
                <View key={type} style={[styles.browseCard, { backgroundColor: tc.surface, borderColor: tc.borderColor, borderLeftColor: meta.color }]}>
                  <Pressable
                    style={styles.browseCardInner}
                    onPress={() => setPreviewType(isOpen ? null : type)}>
                    <ThemedText style={styles.browseIcon}>{meta.icon}</ThemedText>
                    <View style={{ flex: 1 }}>
                      <View style={styles.browseTitleRow}>
                        <ThemedText style={[styles.browseTitle, { color: tc.textPrimary }]}>{meta.title}</ThemedText>
                        {isActive && (
                          <View style={[styles.activeBadge, { backgroundColor: meta.color + '30', borderColor: meta.color + '60' }]}>
                            <ThemedText style={[styles.activeBadgeText, { color: meta.color }]}>ACTIVE</ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText style={[styles.browseDesc, { color: tc.textSecondary }]}>{meta.description}</ThemedText>
                      <ThemedText style={[styles.browseCount, { color: tc.textMuted }]}>{meta.checklist.length} tasks · tap to preview</ThemedText>
                    </View>
                    <ThemedText style={{ color: meta.color, fontSize: 16 }}>{isOpen ? '▲' : '▼'}</ThemedText>
                  </Pressable>

                  {isOpen && (
                    <View style={[styles.browsePreview, { borderTopColor: tc.borderColor }]}>
                      {meta.checklist.slice(0, 5).map((item) => (
                        <View key={item.id} style={styles.browsePreviewItem}>
                          <ThemedText style={[styles.browsePreviewDot, { color: meta.color }]}>○</ThemedText>
                          <ThemedText style={[styles.browsePreviewLabel, { color: tc.textSecondary }]}>{item.label}</ThemedText>
                        </View>
                      ))}
                      {meta.checklist.length > 5 && (
                        <ThemedText style={[styles.browsePreviewMore, { color: tc.textMuted }]}>+{meta.checklist.length - 5} more tasks</ThemedText>
                      )}
                      {!isActive && (
                        <Pressable
                          onPress={() => handleActivate(type)}
                          style={[styles.browseActivateBtn, { backgroundColor: meta.color + '20', borderColor: meta.color + '60' }]}>
                          <ThemedText style={[styles.browseActivateBtnText, { color: meta.color }]}>
                            + ADD TO ACTIVE LIST
                          </ThemedText>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  backBtn: { paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical, lineHeight: 22 },
  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  pageTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  pageSub: { fontSize: 12, marginTop: 4, lineHeight: 17 },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Brand.accent },
  tabText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tabTextActive: { color: Brand.accent },

  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 40 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: Spacing.two },
  emptyIcon: { fontSize: 40, lineHeight: 48 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptySub: { fontSize: 12, textAlign: 'center', lineHeight: 17 },
  browseBtn: {
    backgroundColor: Brand.accent,
    borderRadius: 4,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  browseBtnText: { color: '#04080F', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  eventCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  eventIcon: { fontSize: 24, lineHeight: 30 },
  eventTitle: { fontSize: 14, fontWeight: '800' },
  eventProgress: { fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 14, fontWeight: '700' },

  progressTrack: {
    height: 3,
    marginHorizontal: Spacing.three,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 3, borderRadius: 2 },

  checklist: { padding: Spacing.three, gap: Spacing.one + 2 },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '900', lineHeight: 14 },
  checkLabel: { fontSize: 12, lineHeight: 17 },
  checkLabelDone: { textDecorationLine: 'line-through' },
  checkCategory: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 1 },

  completeBanner: {
    backgroundColor: '#0A1F0A',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1A4A1A',
    padding: Spacing.two,
    alignItems: 'center',
  },
  completeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  dismissedSection: { gap: Spacing.one, marginTop: Spacing.two },
  dismissedLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  dismissedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dismissedIcon: { fontSize: 18, lineHeight: 24 },
  dismissedTitle: { flex: 1, fontSize: 12 },
  reactivateText: { fontSize: 11, color: Brand.accent, fontWeight: '700' },

  browseCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: Spacing.three,
  },
  browseCardInner: { flexDirection: 'row', gap: Spacing.two },
  browseIcon: { fontSize: 28, lineHeight: 36 },
  browseTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: 2 },
  browseTitle: { fontSize: 14, fontWeight: '800' },
  browseDesc: { fontSize: 11, lineHeight: 16, marginBottom: 4 },
  browseCount: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  activeBadge: {
    borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1,
  },
  activeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  browsePreview: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two, gap: Spacing.one + 2,
  },
  browsePreviewItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one + 2 },
  browsePreviewDot: { fontSize: 11, lineHeight: 18, width: 14 },
  browsePreviewLabel: { flex: 1, fontSize: 11, lineHeight: 16 },
  browsePreviewMore: { fontSize: 10, fontStyle: 'italic', marginLeft: 18 },
  browseActivateBtn: {
    marginTop: Spacing.one + 2, borderWidth: 1, borderRadius: 6,
    padding: Spacing.two, alignItems: 'center',
  },
  browseActivateBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});
