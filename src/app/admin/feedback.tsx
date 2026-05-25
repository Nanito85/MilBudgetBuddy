import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { FeedbackRow, useFeedbackStore } from '@/store/feedback.store';

const CATEGORIES = ['All', 'Bug', 'Feature Request', 'Confusing', 'Payment Issue', 'Military Pay Issue', 'PCS Tool Issue', 'Child Account Issue', 'Spouse Account Issue', 'Other'];
const STATUSES   = ['All', 'new', 'reviewed', 'in_progress', 'fixed', 'wont_fix', 'duplicate'];

const STATUS_COLOR: Record<string, string> = {
  new:         '#F59E0B',
  reviewed:    '#3B82F6',
  in_progress: '#8B5CF6',
  fixed:       '#10B981',
  wont_fix:    '#6B7280',
  duplicate:   '#6B7280',
};

const STATUS_LABEL: Record<string, string> = {
  new:         'NEW',
  reviewed:    'REVIEWED',
  in_progress: 'IN PROGRESS',
  fixed:       'FIXED',
  wont_fix:    "WON'T FIX",
  duplicate:   'DUPLICATE',
};

function StatusPill({ status }: { status: string }) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: (STATUS_COLOR[status] ?? '#6B7280') + '25', borderColor: (STATUS_COLOR[status] ?? '#6B7280') + '60' }]}>
      <ThemedText style={[pillStyles.text, { color: STATUS_COLOR[status] ?? '#6B7280' }]}>
        {STATUS_LABEL[status] ?? status.toUpperCase()}
      </ThemedText>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, borderWidth: 1 },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
});

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ item, onClose, onUpdate }: { item: FeedbackRow; onClose: () => void; onUpdate: (id: string, updates: { status?: string; admin_notes?: string }) => Promise<boolean> }) {
  const [status, setStatus]   = useState(item.status);
  const [notes, setNotes]     = useState(item.admin_notes ?? '');
  const [saving, setSaving]   = useState(false);

  const save = async () => {
    setSaving(true);
    const ok = await onUpdate(item.id, { status, admin_notes: notes });
    setSaving(false);
    if (ok) onClose();
    else Alert.alert('Error', 'Failed to save changes.');
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#04080F' }}>
        <View style={detail.header}>
          <Pressable onPress={onClose} hitSlop={12}>
            <ThemedText style={detail.back}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={detail.title}>FEEDBACK DETAIL</ThemedText>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={detail.body} showsVerticalScrollIndicator={false}>
          {/* Meta */}
          <View style={detail.metaRow}>
            <ThemedText style={detail.metaVal}>{item.category}</ThemedText>
            <StatusPill status={item.status} />
          </View>
          <ThemedText style={detail.metaSmall}>
            {new Date(item.created_at).toLocaleString()} · {item.device_type ?? '?'} · v{item.app_version ?? '?'}
          </ThemedText>
          {item.user_email && <ThemedText style={detail.metaSmall}>{item.user_email} · {item.user_role ?? 'unknown role'}</ThemedText>}
          {item.screen_name && <ThemedText style={detail.metaSmall}>Screen: {item.screen_name}</ThemedText>}

          {/* Message */}
          <ThemedText style={detail.sectionLabel}>MESSAGE</ThemedText>
          <View style={detail.messageBox}>
            <ThemedText style={detail.message}>{item.message}</ThemedText>
          </View>

          {/* Status */}
          <ThemedText style={detail.sectionLabel}>UPDATE STATUS</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={detail.statusRow}>
            {STATUSES.filter((s) => s !== 'All').map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[detail.statusChip, status === s && { borderColor: STATUS_COLOR[s] ?? '#888', backgroundColor: (STATUS_COLOR[s] ?? '#888') + '20' }]}>
                <ThemedText style={[detail.statusChipText, status === s && { color: STATUS_COLOR[s] }]}>
                  {STATUS_LABEL[s]}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {/* Admin notes */}
          <ThemedText style={detail.sectionLabel}>ADMIN NOTES</ThemedText>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Internal notes (not shown to user)..."
            placeholderTextColor="#2A4A60"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={detail.notesInput}
          />

          <Pressable
            onPress={save}
            disabled={saving}
            style={({ pressed }) => [detail.saveBtn, pressed && { opacity: 0.7 }, saving && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <ThemedText style={detail.saveBtnText}>SAVE CHANGES</ThemedText>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const detail = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border },
  back: { fontSize: 15, color: Brand.tactical, fontWeight: '600' },
  title: { fontSize: 12, fontWeight: '800', color: '#C8D8E8', letterSpacing: 1.5 },
  body: { padding: Spacing.three, gap: Spacing.three },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaVal: { fontSize: 16, fontWeight: '800', color: '#C8D8E8' },
  metaSmall: { fontSize: 11, color: '#4D7A9A', lineHeight: 16 },
  sectionLabel: { color: '#3D6080', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: Spacing.one },
  messageBox: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 6, padding: Spacing.three },
  message: { fontSize: 14, color: '#C8D8E8', lineHeight: 21 },
  statusRow: { gap: Spacing.one + 2, paddingVertical: Spacing.one },
  statusChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, backgroundColor: '#080E1C' },
  statusChipText: { fontSize: 10, fontWeight: '800', color: '#4D7A9A', letterSpacing: 0.3 },
  notesInput: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 6, padding: Spacing.two + 2, fontSize: 14, color: '#C8D8E8', minHeight: 90 },
  saveBtn: { backgroundColor: Brand.tactical, borderRadius: 6, padding: Spacing.three, alignItems: 'center', marginTop: Spacing.two },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminFeedbackScreen() {
  const router = useRouter();
  const { adminFeedback, adminTotal, adminLoading, adminError, fetchFeedback, updateFeedback } = useFeedbackStore();

  const [catFilter, setCatFilter]    = useState('All');
  const [statusFilter, setStatus]    = useState('All');
  const [search, setSearch]          = useState('');
  const [selected, setSelected]      = useState<FeedbackRow | null>(null);

  const load = useCallback((reset = false) => {
    fetchFeedback({
      category: catFilter !== 'All' ? catFilter : undefined,
      status:   statusFilter !== 'All' ? statusFilter : undefined,
      search:   search.trim() || undefined,
      offset:   reset ? 0 : adminFeedback.length,
    });
  }, [catFilter, statusFilter, search]);

  useEffect(() => { load(true); }, [catFilter, statusFilter]);

  const exportCsv = async () => {
    const rows = adminFeedback.map((f) => [f.created_at, f.category, f.status, f.message.replace(/\n/g, ' '), f.user_email ?? ''].join(','));
    const csv = ['created_at,category,status,message,email', ...rows].join('\n');
    Share.share({ title: 'feedback-export.csv', message: csv });
  };

  const renderItem = ({ item }: { item: FeedbackRow }) => (
    <Pressable onPress={() => setSelected(item)} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.catBar, { backgroundColor: Brand.tactical }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.rowCat}>{item.category}</ThemedText>
          <StatusPill status={item.status} />
        </View>
        <ThemedText style={styles.rowMsg} numberOfLines={2}>{item.message}</ThemedText>
        <ThemedText style={styles.rowMeta}>
          {new Date(item.created_at).toLocaleDateString()} · {item.device_type ?? 'unknown'} · {item.user_email ?? 'anon'}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText style={styles.back}>‹ Back</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>FEEDBACK</ThemedText>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/admin/reports' as any)} hitSlop={12}>
            <ThemedText style={styles.reportsLink}>Reports ›</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <ThemedText style={styles.statsText}>{adminTotal} total</ThemedText>
        <Pressable onPress={exportCsv}>
          <ThemedText style={styles.exportBtn}>⬇ EXPORT CSV</ThemedText>
        </Pressable>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat} onPress={() => setCatFilter(cat)}
            style={[styles.filterChip, catFilter === cat && styles.filterChipActive]}>
            <ThemedText style={[styles.filterChipText, catFilter === cat && styles.filterChipTextActive]}>
              {cat}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { paddingTop: 0 }]}>
        {STATUSES.map((s) => (
          <Pressable key={s} onPress={() => setStatus(s)}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}>
            <ThemedText style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {s === 'All' ? 'All status' : STATUS_LABEL[s]}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(true)}
          placeholder="Search messages..."
          placeholderTextColor="#2A4A60"
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      {/* List */}
      {adminLoading && adminFeedback.length === 0 ? (
        <ActivityIndicator color={Brand.tactical} style={{ marginTop: 40 }} />
      ) : adminError ? (
        <View style={styles.emptyBox}>
          <ThemedText style={styles.emptyText}>{adminError}</ThemedText>
          <Pressable onPress={() => load(true)} style={styles.retryBtn}>
            <ThemedText style={styles.retryText}>RETRY</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={adminFeedback}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={() => load(false)}
          onEndReachedThreshold={0.3}
          onRefresh={() => load(true)}
          refreshing={adminLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <ThemedText style={styles.emptyText}>No feedback found.</ThemedText>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Brand.border }} />}
        />
      )}

      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateFeedback}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04080F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border },
  back: { fontSize: 15, color: Brand.tactical, fontWeight: '600', width: 60 },
  title: { fontSize: 13, fontWeight: '900', color: '#C8D8E8', letterSpacing: 2 },
  headerRight: { width: 60, alignItems: 'flex-end' },
  reportsLink: { fontSize: 12, color: Brand.tactical, fontWeight: '700' },
  statsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border },
  statsText: { fontSize: 11, color: '#4D7A9A' },
  exportBtn: { fontSize: 10, color: Brand.accent, fontWeight: '800', letterSpacing: 0.5 },
  filterRow: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.one + 2 },
  filterChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 3, borderWidth: 1, borderColor: Brand.border, backgroundColor: '#080E1C' },
  filterChipActive: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  filterChipText: { fontSize: 10, color: '#4D7A9A', fontWeight: '700', letterSpacing: 0.3 },
  filterChipTextActive: { color: Brand.tactical },
  searchWrap: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  searchInput: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 6, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.one + 4, fontSize: 14, color: '#C8D8E8' },
  list: { paddingBottom: 40 },
  row: { flexDirection: 'row', backgroundColor: '#080E1C' },
  catBar: { width: 3 },
  rowContent: { flex: 1, padding: Spacing.two + 2, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowCat: { fontSize: 12, fontWeight: '800', color: '#C8D8E8', letterSpacing: 0.3 },
  rowMsg: { fontSize: 13, color: '#6B92B0', lineHeight: 19 },
  rowMeta: { fontSize: 10, color: '#3D6080' },
  emptyBox: { flex: 1, alignItems: 'center', paddingTop: 60, gap: Spacing.two },
  emptyText: { color: '#4D7A9A', fontSize: 13 },
  retryBtn: { backgroundColor: Brand.tactical + '20', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 4 },
  retryText: { color: Brand.tactical, fontSize: 11, fontWeight: '800' },
});
