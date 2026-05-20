import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    clearError();
    await signIn(email.trim().toLowerCase(), password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safe}>

        <View style={styles.hero}>
          <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
          <ThemedText style={styles.title}>SIGN IN</ThemedText>
          <ThemedText style={styles.sub}>
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
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#2A4A60"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              style={styles.input}
            />
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
          <ThemedText style={styles.footerText}>Don't have an account?</ThemedText>
          <Pressable onPress={() => router.push('/auth/sign-up' as any)}>
            <ThemedText style={styles.footerLink}>Create account →</ThemedText>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push('/' as any)}
          style={styles.skipBtn}>
          <ThemedText style={styles.skipText}>Use without account (local only)</ThemedText>
        </Pressable>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04080F' },
  safe: { flex: 1, paddingHorizontal: Spacing.three, justifyContent: 'center', gap: Spacing.four },

  hero: { gap: Spacing.one },
  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', color: '#C8D8E8', letterSpacing: 0.5, marginTop: 2 },
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

  btn: {
    backgroundColor: Brand.tactical,
    borderRadius: 6,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  footerText: { color: '#6B92B0', fontSize: 13 },
  footerLink: { color: Brand.tactical, fontSize: 13, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  skipText: { color: '#3D5870', fontSize: 12 },
});
