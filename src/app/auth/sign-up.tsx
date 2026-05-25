import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading, error, clearError, user } = useAuthStore();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignUp = async () => {
    setLocalError('');
    clearError();
    if (!email.trim() || !password) return;
    if (password !== confirm) {
      setLocalError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    await signUp(email.trim().toLowerCase(), password);
  };

  const displayError = localError || error;
  const canSubmit = !loading && email.trim().length > 0 && password.length >= 8 && confirm.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>

          <View style={styles.hero}>
            <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
            <ThemedText style={styles.title}>CREATE ACCOUNT</ThemedText>
            <ThemedText style={styles.slogan}>Your Money. Your Mission.</ThemedText>
            <ThemedText style={styles.sub}>
              Your data syncs securely across all your devices. One account covers the whole family.
            </ThemedText>
          </View>

          <View style={styles.form}>
            {displayError ? (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{displayError}</ThemedText>
              </View>
            ) : null}

            <View style={styles.fieldWrap}>
              <ThemedText style={styles.label}>EMAIL</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#2A4A60"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldWrap}>
              <ThemedText style={styles.label}>PASSWORD</ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  placeholderTextColor="#2A4A60"
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  style={styles.inputFlex}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#4D7A9A" />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <ThemedText style={styles.label}>CONFIRM PASSWORD</ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Re-enter password"
                  placeholderTextColor="#2A4A60"
                  secureTextEntry={!showConfirm}
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                  style={styles.inputFlex}
                />
                <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#4D7A9A" />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSignUp}
              disabled={!canSubmit}
              style={({ pressed }) => [styles.btn, !canSubmit && { opacity: 0.5 }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={styles.btnText}>
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </ThemedText>
            </Pressable>

            <View style={styles.note}>
              <ThemedText style={styles.noteText}>
                🔒  Your data is private and encrypted. We never share it.
              </ThemedText>
            </View>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>Already have an account?</ThemedText>
            <Pressable onPress={() => router.push('/auth/sign-in' as any)}>
              <ThemedText style={styles.footerLink}>Sign in →</ThemedText>
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04080F' },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.four },

  backBtn: { paddingVertical: Spacing.three, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical, lineHeight: 22 },

  hero: { gap: Spacing.one },
  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: '#C8D8E8', letterSpacing: 0.5, marginTop: 2 },
  slogan: { fontSize: 14, fontWeight: '700', color: Brand.tactical, letterSpacing: 0.3, marginTop: 2 },
  sub: { fontSize: 13, color: '#6B92B0', lineHeight: 19, marginTop: 4 },

  form: { gap: Spacing.three },
  errorBox: { backgroundColor: Brand.danger + '15', borderWidth: 1, borderColor: Brand.danger + '40', borderRadius: 6, padding: Spacing.two + 2 },
  errorText: { color: Brand.danger, fontSize: 13, lineHeight: 18 },

  fieldWrap: { gap: Spacing.one },
  label: { color: '#4D7A9A', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
    color: '#C8D8E8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 6,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
    color: '#C8D8E8',
  },
  eyeBtn: { paddingHorizontal: Spacing.two + 2 },

  btn: { backgroundColor: Brand.tactical, borderRadius: 6, padding: Spacing.three, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  note: { backgroundColor: '#080E1C', borderWidth: StyleSheet.hairlineWidth, borderColor: Brand.border, borderRadius: 6, padding: Spacing.two + 2 },
  noteText: { fontSize: 12, color: '#4D7A9A', lineHeight: 17 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { color: '#6B92B0', fontSize: 13 },
  footerLink: { color: Brand.tactical, fontSize: 13, fontWeight: '700' },
});
