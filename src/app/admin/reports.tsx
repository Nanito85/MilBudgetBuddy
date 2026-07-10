import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { ReportRow, useFeedbackStore } from '@/store/feedback.store';

// ─── Report Detail Modal ──────────────────────────────────────────────────────

function ReportDetailModal({ report, onClose }: { report: ReportRow; onClose: () => void }) {
  const tc = useThemeColors();
  const { fetchReportDetail } = useFeedbackStore();
  const [full, setFull] = useState<ReportRow | null>(null);

  useEffect(() => {
    if (report.id) fetchReportDetail(report.id).then((r) => r && setFull(r));
  }, [report.id]);

  const data = full ?? report;
  const fr   = (data.full_report ?? {}) as Record<string, unknown>;

  const Section = ({ title, items }: { title: string; items?: unknown }) => (
    <>
      <ThemedText style={[modal.sectionLabel, { color: tc.textMuted }]}>{title}</ThemedText>
      {Array.isArray(items) && items.length > 0
        ? items.map((item: unknown, i: number) => (
            <ThemedText key={i} style={[modal.item, { color: tc.textPrimary }]}>• {String(item)}</ThemedText>
          ))
        : <ThemedText style={[modal.itemNone, { color: tc.textHint }]}>None reported.</ThemedText>}
    </>
  );

  const shareSummary = () => {
    const text = [
      `MilBudgetBuddy ${data.report_type === 'daily' ? 'Daily' : 'Weekly'} Report`,
      `Period: ${new Date(data.start_date).toLocaleDateString()} → ${new Date(data.end_date).toLocaleDateString()}`,
      `Feedback count: ${data.feedback_count}`,
      '',
      data.summary ?? '',
    ].join('\n');
    Share.share({ title: 'Feedback Report', message: text });
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: tc.background }}>
        <View style={[modal.header, { borderBottomColor: tc.borderColor }]}>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText style={modal.back}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[modal.title, { color: tc.textPrimary }]}>{data.report_type.toUpperCase()} REPORT</ThemedText>
          <Pressable onPress={shareSummary} hitSlop={12}>
            <ThemedText style={modal.share}>COPY</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={modal.body} showsVerticalScrollIndicator={false}>
          {/* Meta */}
          <View style={[modal.metaBox, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[modal.metaDate, { color: tc.textSecondary }]}>
              {new Date(data.start_date).toLocaleDateString()} → {new Date(data.end_date).toLocaleDateString()}
            </ThemedText>
            <ThemedText style={[modal.metaCount, { color: tc.textPrimary }]}>{data.feedback_count} feedback item{data.feedback_count !== 1 ? 's' : ''}</ThemedText>
          </View>

          {/* Urgent items */}
          {Array.isArray(data.urgent_items) && data.urgent_items.length > 0 && (
            <View style={modal.urgentBox}>
              <ThemedText style={modal.urgentLabel}>⚠️ URGENT</ThemedText>
              {data.urgent_items.map((u, i) => (
                <ThemedText key={i} style={modal.urgentItem}>• {u}</ThemedText>
              ))}
            </View>
          )}

          {/* Category breakdown */}
          <ThemedText style={[modal.sectionLabel, { color: tc.textMuted }]}>CATEGORY BREAKDOWN</ThemedText>
          {Object.entries(data.top_categories ?? {})
            .sort((a, b) => b[1] - a[1])
            .map(([cat, n]) => (
              <View key={cat} style={[modal.catRow, { borderBottomColor: tc.borderColor }]}>
                <ThemedText style={[modal.catName, { color: tc.textPrimary }]}>{cat}</ThemedText>
                <ThemedText style={modal.catCount}>{n}</ThemedText>
              </View>
            ))}

          {/* Executive summary */}
          <ThemedText style={[modal.sectionLabel, { color: tc.textMuted }]}>EXECUTIVE SUMMARY</ThemedText>
          <ThemedText style={[modal.summaryText, { color: tc.textPrimary }]}>{data.summary ?? 'No summary generated.'}</ThemedText>

          <Section title="🐛 BUGS REPORTED"           items={fr.bugs_reported} />
          <Section title="✨ FEATURE REQUESTS"         items={fr.top_feature_requests} />
          <Section title="😤 TOP COMPLAINTS"           items={fr.top_complaints} />
          <Section title="💳 PAYMENT ISSUES"           items={fr.payment_issues} />
          <Section title="🪖 MILITARY-SPECIFIC ISSUES" items={fr.military_specific_issues} />
          <Section title="👨‍👩‍👧 CHILD / SPOUSE ISSUES"  items={fr.child_spouse_issues} />
          <Section title="👍 POSITIVE FEEDBACK"        items={fr.positive_feedback} />
          <Section title="🎯 RECOMMENDED NEXT ACTIONS" items={fr.recommended_next_actions} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  back:  { fontSize: 15, color: Brand.tactical, fontWeight: '600' },
  title: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  share: { fontSize: 11, color: Brand.accent, fontWeight: '800', letterSpacing: 0.5 },
  body:  { padding: Spacing.three, gap: Spacing.two + 2 },
  metaBox: { borderWidth: 1, borderRadius: 6, padding: Spacing.two + 2, gap: 4 },
  metaDate:  { fontSize: 13 },
  metaCount: { fontSize: 20, fontWeight: '900' },
  urgentBox: { backgroundColor: '#F59E0B15', borderWidth: 1, borderColor: '#F59E0B40', borderRadius: 6, padding: Spacing.two + 2, gap: 4 },
  urgentLabel: { color: '#F59E0B', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  urgentItem:  { color: '#F59E0B', fontSize: 13, lineHeight: 19 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: Spacing.one },
  catRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  catName: { fontSize: 13 },
  catCount: { fontSize: 13, fontWeight: '800', color: Brand.tactical },
  summaryText: { fontSize: 14, lineHeight: 22 },
  item:     { fontSize: 13, lineHeight: 20, paddingLeft: Spacing.one },
  itemNone: { fontSize: 12, fontStyle: 'italic' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminReportsScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const { reports, reportsLoading, reportGenerating, fetchReports, generateReport } = useFeedbackStore();
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = (type: 'daily' | 'weekly') => {
    Alert.alert(
      `Generate ${type === 'daily' ? 'Daily' : 'Weekly'} Report`,
      `This will analyze all feedback from the past ${type === 'daily' ? '24 hours' : '7 days'} using AI and send an email summary.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            const result = await generateReport(type);
            if (result) {
              Alert.alert('Report Generated', `${result.feedback_count} items analyzed. Email sent to admin.`);
              fetchReports();
            } else {
              Alert.alert('Error', 'Failed to generate report.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ReportRow }) => (
    <Pressable
      onPress={() => setSelectedReport(item)}
      style={({ pressed }) => [styles.reportRow, { backgroundColor: tc.surface }, pressed && { opacity: 0.7 }]}>
      <View style={[styles.typeBadge, { backgroundColor: item.report_type === 'daily' ? Brand.tactical + '25' : Brand.accent + '25', borderColor: item.report_type === 'daily' ? Brand.tactical + '60' : Brand.accent + '60' }]}>
        <ThemedText style={[styles.typeBadgeText, { color: item.report_type === 'daily' ? Brand.tactical : Brand.accent }]}>
          {item.report_type.toUpperCase()}
        </ThemedText>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <ThemedText style={[styles.reportDate, { color: tc.textPrimary }]}>
          {new Date(item.start_date).toLocaleDateString()} → {new Date(item.end_date).toLocaleDateString()}
        </ThemedText>
        <ThemedText style={[styles.reportCount, { color: tc.textHint }]}>{item.feedback_count} item{item.feedback_count !== 1 ? 's' : ''} analyzed</ThemedText>
        {item.summary && (
          <ThemedText style={[styles.reportSummary, { color: tc.textSecondary }]} numberOfLines={2}>{item.summary}</ThemedText>
        )}
      </View>
      <ThemedText style={[styles.chevron, { color: tc.textHint }]}>›</ThemedText>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tc.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tc.borderColor }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText style={styles.back}>‹ Back</ThemedText>
        </Pressable>
        <ThemedText style={[styles.title, { color: tc.textPrimary }]}>AI REPORTS</ThemedText>
        <View style={{ width: 60 }} />
      </View>

      {/* Generate buttons */}
      <View style={styles.generateRow}>
        <Pressable
          onPress={() => handleGenerate('daily')}
          disabled={reportGenerating}
          style={({ pressed }) => [styles.genBtn, styles.genBtnDaily, (pressed || reportGenerating) && { opacity: 0.7 }]}>
          {reportGenerating
            ? <ActivityIndicator color="#fff" size="small" />
            : <ThemedText style={styles.genBtnText}>⚡ DAILY REPORT</ThemedText>}
        </Pressable>
        <Pressable
          onPress={() => handleGenerate('weekly')}
          disabled={reportGenerating}
          style={({ pressed }) => [styles.genBtn, styles.genBtnWeekly, { backgroundColor: tc.surface }, (pressed || reportGenerating) && { opacity: 0.7 }]}>
          {reportGenerating
            ? <ActivityIndicator color={Brand.accent} size="small" />
            : <ThemedText style={[styles.genBtnText, { color: Brand.accent }]}>📊 WEEKLY REPORT</ThemedText>}
        </Pressable>
      </View>

      <ThemedText style={[styles.hint, { color: tc.textMuted }]}>
        Reports analyze all feedback in the period using AI and send an email to your admin address.
      </ThemedText>

      {/* List */}
      {reportsLoading && reports.length === 0 ? (
        <ActivityIndicator color={Brand.tactical} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={fetchReports}
          refreshing={reportsLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <ThemedText style={[styles.emptyText, { color: tc.textHint }]}>No reports yet. Generate your first one above.</ThemedText>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tc.borderColor }} />}
        />
      )}

      {selectedReport && (
        <ReportDetailModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  back:  { fontSize: 15, color: Brand.tactical, fontWeight: '600', width: 60 },
  title: { fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  generateRow: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three },
  genBtn: { flex: 1, borderRadius: 6, padding: Spacing.two + 2, alignItems: 'center', borderWidth: 1 },
  genBtnDaily:  { backgroundColor: Brand.tactical, borderColor: Brand.tactical },
  genBtnWeekly: { borderColor: Brand.accent },
  genBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  hint: { fontSize: 11, textAlign: 'center', paddingHorizontal: Spacing.four, paddingBottom: Spacing.two, lineHeight: 16 },
  list: { paddingBottom: 40 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 3, borderWidth: 1, minWidth: 52, alignItems: 'center' },
  typeBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  reportDate:    { fontSize: 12, fontWeight: '700' },
  reportCount:   { fontSize: 11 },
  reportSummary: { fontSize: 12, lineHeight: 17 },
  chevron: { fontSize: 20 },
  emptyBox: { alignItems: 'center', paddingTop: 40, paddingHorizontal: Spacing.four },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
