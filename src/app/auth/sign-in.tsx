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
import { useThemeColors } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth.store';

export default function SignInScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const { signIn, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    clearError();
    await signIn(email.trim().toLowerCase(), password);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: tc.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={{ flex: 1, backgroundColor: tc.background }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.hero}>
            <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
            <ThemedText style={[styles.title, { color: tc.textPrimary }]}>SIGN IN</ThemedText>
            <ThemedText style={styles.slogan}>Your Money. Your Mission.</ThemedText>
            <ThemedText style={[styles.sub, { color: tc.textSecondary }]}>
              Access your financial data from any device.
            </ThemedText>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : null}

            <View style={styles.fieldWrap}>
              <ThemedText style={[styles.label, { color: tc.textHint }]}>EMAIL</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={tc.textHint}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                style={[styles.input, { backgroundColor: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]}
              />
            </View>

            <View style={styles.fieldWrap}>
              <ThemedText style={[styles.label, { color: tc.textHint }]}>PASSWORD</ThemedText>
              <View style={[styles.inputRow, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={tc.textHint}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                  style={[styles.inputFlex, { color: tc.textPrimary }]}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={tc.textHint} />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSignIn}
              disabled={loading || !email.trim() || !password}
              style={({ pressed }) => [
                styles.btn,
                (loading || !email.trim() || !password) && { opacity: 0.5 },
                pressed && { opacity: 0.7 },
              ]}>
              <ThemedText style={styles.btnText}>
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText style={[styles.footerText, { color: tc.textSecondary }]}>Don't have an account?</ThemedText>
            <Pressable onPress={() => router.push('/auth/sign-up' as any)}>
              <ThemedText style={styles.footerLink}>Create account →</ThemedText>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/' as any)}
            style={styles.skipBtn}>
            <ThemedText style={[styles.skipText, { color: tc.textMuted }]}>Use without account (local only)</ThemedText>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.four,
  },

  hero: { gap: Spacing.one },
  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  slogan: { fontSize: 14, fontWeight: '700', color: Brand.tactical, letterSpacing: 0.3, marginTop: 2 },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 4 },

  form: { gap: Spacing.three },
  errorBox: { backgroundColor: Brand.danger + '15', borderWidth: 1, borderColor: Brand.danger + '40', borderRadius: 6, padding: Spacing.two + 2 },
  errorText: { color: Brand.danger, fontSize: 13, lineHeight: 18 },

  fieldWrap: { gap: Spacing.one },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
  },
  inputFlex: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
  },
  eyeBtn: { paddingHorizontal: Spacing.two + 2 },

  btn: {
    backgroundColor: Brand.tactical,
    borderRadius: 6,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13 },
  footerLink: { color: Brand.tactical, fontSize: 13, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  skipText: { fontSize: 12 },
});
