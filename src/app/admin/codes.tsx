import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { auth } from '@/services/firebase';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

interface DiscountCode {
  id:           string;
  code:         string;
  discountPct:  number;   // 0-100
  durationDays: number;   // pro access granted for this many days
  maxUses:      number;   // 0 = unlimited
  usedCount:    number;
  expiresAt:    string | null; // ISO date or null
  active:       boolean;
  createdAt:    string;
}

async function getToken(): Promise<string | null> {
  try { return await auth.currentUser?.getIdToken() ?? null; } catch { return null; }
}

// ── Create Code Form ───────────────────────────────────────────────────────────

function CreateCodeForm({ onCreated }: { onCreated: () => void }) {
  const [code,         setCode]         = useState('');
  const [discountPct,  setDiscountPct]  = useState('100');
  const [durationDays, setDurationDays] = useState('30');
  const [maxUses,      setMaxUses]      = useState('0');
  const [expiresAt,    setExpiresAt]    = useState('');
  const [saving,       setSaving]       = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  const handleCreate = async () => {
    if (!code.trim()) { Alert.alert('Error', 'Enter or generate a code.'); return; }
    const pct = parseInt(discountPct, 10);
    const dur = parseInt(durationDays, 10);
    if (isNaN(pct) || pct < 1 || pct > 100) { Alert.alert('Error', 'Discount must be 1-100%.'); return; }
    if (isNaN(dur) || dur < 1)               { Alert.alert('Error', 'Duration must be at least 1 day.'); return; }

    setSaving(true);
    const token = await getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code:         code.toUpperCase().trim(),
          discountPct:  pct,
          durationDays: dur,
          maxUses:      parseInt(maxUses, 10) || 0,
          expiresAt:    expiresAt || null,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error ?? `Server error ${res.status}`);
      } else {
        Alert.alert('Created', `Code "${code.toUpperCase()}" is live.`);
        setCode(''); setDiscountPct('100'); setDurationDays('30'); setMaxUses('0'); setExpiresAt('');
        onCreated();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.card}>
      <ThemedText style={s.cardTitle}>// CREATE NEW CODE</ThemedText>

      <ThemedText style={s.label}>CODE</ThemedText>
      <View style={s.codeRow}>
        <View style={[s.input, { flex: 1 }]}>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="e.g. MILSAVE50"
            placeholderTextColor="#2A4A60"
            style={s.inputText}
            autoCapitalize="characters"
            maxLength={20}
          />
        </View>
        <Pressable onPress={generateCode} style={s.genBtn}>
          <ThemedText style={s.genBtnText}>GENERATE</ThemedText>
        </Pressable>
      </View>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.label}>DISCOUNT %</ThemedText>
          <View style={s.input}>
            <TextInput value={discountPct} onChangeText={setDiscountPct} keyboardType="number-pad"
              placeholderTextColor="#2A4A60" style={s.inputText} maxLength={3} />
          </View>
          <ThemedText style={s.hint}>100% = free access for duration</ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.label}>DURATION (DAYS)</ThemedText>
          <View style={s.input}>
            <TextInput value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad"
              placeholderTextColor="#2A4A60" style={s.inputText} maxLength={4} />
          </View>
          <ThemedText style={s.hint}>Days of Pro access granted</ThemedText>
        </View>
      </View>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.label}>MAX USES (0 = unlimited)</ThemedText>
          <View style={s.input}>
            <TextInput value={maxUses} onChangeText={setMaxUses} keyboardType="number-pad"
              placeholderTextColor="#2A4A60" style={s.inputText} maxLength={6} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={s.label}>EXPIRES (YYYY-MM-DD)</ThemedText>
          <View style={s.input}>
            <TextInput value={expiresAt} onChangeText={setExpiresAt} placeholder="Leave blank = never"
              placeholderTextColor="#2A4A60" style={s.inputText} maxLength={10} />
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleCreate}
        disabled={saving}
        style={({ pressed }) => [s.createBtn, (saving || pressed) && { opacity: 0.6 }]}>
        <ThemedText style={s.createBtnText}>{saving ? 'CREATING...' : '+ CREATE CODE'}</ThemedText>
      </Pressable>
    </View>
  );
}

// ── Code Row ───────────────────────────────────────────────────────────────────

function CodeRow({ item, onToggle, onDelete }: { item: DiscountCode; onToggle: () => void; onDelete: () => void }) {
  const expired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
  const exhausted = item.maxUses > 0 && item.usedCount >= item.maxUses;
  const statusColor = !item.active || expired || exhausted ? '#6B7280' : Brand.tactical;
  const statusLabel = !item.active ? 'DISABLED' : expired ? 'EXPIRED' : exhausted ? 'EXHAUSTED' : 'ACTIVE';

  return (
    <View style={s.codeCard}>
      <View style={s.codeCardTop}>
        <ThemedText style={[s.codeName, { color: statusColor }]}>{item.code}</ThemedText>
        <View style={[s.statusPill, { backgroundColor: statusColor + '20', borderColor: statusColor + '50' }]}>
          <ThemedText style={[s.statusText, { color: statusColor }]}>{statusLabel}</ThemedText>
        </View>
      </View>
      <View style={s.codeMeta}>
        <ThemedText style={s.codeMetaText}>{item.discountPct}% off · {item.durationDays}d Pro</ThemedText>
        <ThemedText style={s.codeMetaText}>
          {item.usedCount}/{item.maxUses === 0 ? '∞' : item.maxUses} uses
          {item.expiresAt ? ` · exp ${item.expiresAt}` : ''}
        </ThemedText>
      </View>
      <View style={s.codeActions}>
        <Pressable onPress={onToggle} style={[s.actionBtn, { borderColor: Brand.tactical + '50' }]}>
          <ThemedText style={[s.actionBtnText, { color: Brand.tactical }]}>
            {item.active ? 'DISABLE' : 'ENABLE'}
          </ThemedText>
        </Pressable>
        <Pressable onPress={onDelete} style={[s.actionBtn, { borderColor: Brand.classified + '50' }]}>
          <ThemedText style={[s.actionBtnText, { color: Brand.classified }]}>DELETE</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CodesScreen() {
  const router = useRouter();
  const [codes,   setCodes]   = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchCodes = async () => {
    setLoading(true); setError('');
    const token = await getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/codes`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const body = await res.json();
      setCodes(body.codes ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleToggle = (item: DiscountCode) => {
    Alert.alert(
      item.active ? 'Disable Code' : 'Enable Code',
      `${item.active ? 'Disable' : 'Enable'} code "${item.code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item.active ? 'Disable' : 'Enable',
          onPress: async () => {
            const token = await getToken();
            await fetch(`${API_BASE}/api/admin/codes/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ active: !item.active }),
            });
            fetchCodes();
          },
        },
      ],
    );
  };

  const handleDelete = (item: DiscountCode) => {
    Alert.alert('Delete Code', `Permanently delete "${item.code}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const token = await getToken();
          await fetch(`${API_BASE}/api/admin/codes/${item.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchCodes();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.back}>
          <ThemedText style={s.backText}>‹ Admin</ThemedText>
        </Pressable>
        <ThemedText style={s.headerTitle}>🎟️ DISCOUNT CODES</ThemedText>
        <Pressable onPress={fetchCodes} style={s.back}>
          <ThemedText style={s.refreshText}>REFRESH</ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <CreateCodeForm onCreated={fetchCodes} />

        <ThemedText style={s.sectionTitle}>// EXISTING CODES ({codes.length})</ThemedText>

        {loading && <ActivityIndicator color={Brand.accent} style={{ marginTop: Spacing.three }} />}
        {!!error  && <ThemedText style={s.errorText}>{error}</ThemedText>}

        {!loading && codes.length === 0 && !error && (
          <ThemedText style={s.emptyText}>No codes yet. Create one above.</ThemedText>
        )}

        {codes.map((item) => (
          <CodeRow
            key={item.id}
            item={item}
            onToggle={() => handleToggle(item)}
            onDelete={() => handleDelete(item)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#04080F' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  back:    { minWidth: 60 },
  backText:    { color: Brand.tactical, fontSize: 14, fontWeight: '700' },
  refreshText: { color: Brand.accent, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#C8D8E8', letterSpacing: 0.5 },

  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: 60 },

  card:      { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 10, padding: Spacing.three, gap: Spacing.two },
  cardTitle: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },

  label: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 1, marginBottom: 4 },
  hint:  { fontSize: 9, color: '#3D5870', marginTop: 2 },
  input: { backgroundColor: '#04080F', borderWidth: 1, borderColor: Brand.border, borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 2 },
  inputText: { color: '#C8D8E8', fontSize: 15, fontWeight: '700' },

  row:    { flexDirection: 'row', gap: Spacing.two },
  codeRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },

  genBtn:     { backgroundColor: Brand.accent + '20', borderWidth: 1, borderColor: Brand.accent + '60', borderRadius: 6, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one + 4 },
  genBtnText: { color: Brand.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  createBtn:     { backgroundColor: Brand.accent, borderRadius: 6, padding: Spacing.two + 2, alignItems: 'center', marginTop: Spacing.one },
  createBtnText: { color: '#04080F', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  sectionTitle: { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  emptyText:    { color: '#3D6080', fontSize: 12, textAlign: 'center', paddingVertical: Spacing.three },
  errorText:    { color: Brand.classified, fontSize: 12, textAlign: 'center' },

  codeCard:    { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 8, padding: Spacing.two + 2, gap: Spacing.one },
  codeCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeName:    { fontSize: 18, fontWeight: '900', letterSpacing: 2, fontFamily: 'monospace' },
  statusPill:  { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText:  { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  codeMeta:    { gap: 2 },
  codeMetaText:{ fontSize: 10, color: '#4D7A9A' },
  codeActions: { flexDirection: 'row', gap: Spacing.one, marginTop: Spacing.one },
  actionBtn:   { flex: 1, borderWidth: 1, borderRadius: 4, padding: Spacing.one + 2, alignItems: 'center' },
  actionBtnText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
