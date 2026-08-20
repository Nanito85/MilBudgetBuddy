import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useIsAdmin } from '@/hooks/use-admin';
import { useIsPro } from '@/hooks/use-is-pro';
import { useAuthStore } from '@/store/auth.store';

// Master kill switch — flip to true and OTA-publish once the Pro subscription
// (7-day trial via Google Play/App Store) has actually gone live in both
// stores. Until then this stays false so the gate never activates, no matter
// what any individual member's entitlement looks like.
//
// Flipped true 2026-08-20 after a real Google Play sandbox purchase test
// confirmed the full buy -> /api/iap/verify -> proExpiresAt unlock flow
// works end to end on Android.
const PRO_GATE_ENABLED = true;

// iOS purchase verification is still stubbed server-side (milbudgetbuddy-api
// src/routes/iap.ts returns 501 for platform: 'ios' — needs a .p8 signing
// key + Key ID + Issuer ID from App Store Connect that don't exist yet). If
// the gate applied to iOS now, an iOS member could pay Apple and STILL never
// unlock — verification would 501 forever, worse than today's free access.
// So the gate is Android-only until that backend gap is closed; flip this to
// `true` (or drop the platform check) once iOS verification actually works.
const IOS_GATE_ENABLED = false;
const GATE_ACTIVE_ON_THIS_PLATFORM = Platform.OS === 'ios' ? IOS_GATE_ENABLED : PRO_GATE_ENABLED;

// Screens that must always work regardless of Pro status — otherwise a member
// could never actually pay, sign in, manage their account, or read legal
// docs. Everything else is gated by default (safer than listing every gated
// screen, which would silently leave new screens un-gated if forgotten).
const ALWAYS_ALLOWED_PREFIXES = [
  '/paywall',
  '/settings',
  '/auth',
  '/legal',
  '/terms',
  '/privacy-center',
  '/profile',
  '/admin',
];

/**
 * Wraps the whole app. When a member has no active Pro entitlement (trial
 * never started, expired, or cancelled and past the paid period), every
 * screen outside the always-allowed list renders dimmed and non-interactive
 * — data stays fully visible (nothing is deleted or hidden), but nothing can
 * be tapped, scrolled, or edited. A floating unlock card sits on top.
 */
export function ProGateOverlay({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPro = useIsPro();
  const { isAdmin } = useIsAdmin();
  const authUser = useAuthStore((s) => s.user);

  const allowed = ALWAYS_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const gated = GATE_ACTIVE_ON_THIS_PLATFORM && !isPro && !isAdmin && !allowed;

  // The gate dims and disables pointerEvents on the ENTIRE app content below
  // — including the bottom tab bar, since that's rendered inside `children`
  // too. That's fine for a signed-in member (the floating card routes them
  // straight to checkout), but a signed-out member has no way to purchase
  // (verification requires an auth token) and, before this fix, had no way
  // to even REACH sign-in either — the only tappable thing left anywhere in
  // the app was this card, which pushed straight to /paywall, and paywall
  // itself has no sign-in UI. That's a hard lockout, not just an inconvenience.
  // So: send a signed-out member to sign-in first, not straight to paywall.
  const unlockRoute = authUser ? '/paywall' : '/auth/sign-in';
  const unlockCopy = authUser
    ? 'Start your 7-day free trial to unlock this screen — and everything else.'
    : 'Sign in to start your 7-day free trial and unlock this screen — and everything else.';
  const unlockBtnLabel = authUser ? 'UNLOCK NOW' : 'SIGN IN';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, opacity: gated ? 0.35 : 1 }} pointerEvents={gated ? 'none' : 'auto'}>
        {children}
      </View>

      {gated && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable style={styles.card} onPress={() => router.push(unlockRoute as any)}>
            <ThemedText style={styles.lockIcon}>🔒</ThemedText>
            <ThemedText style={styles.title}>MILBUDGETBUDDY PRO</ThemedText>
            <ThemedText style={styles.sub}>{unlockCopy}</ThemedText>
            <View style={styles.btn}>
              <ThemedText style={styles.btnText}>{unlockBtnLabel}</ThemedText>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  card: {
    margin: Spacing.four,
    marginBottom: Spacing.six,
    backgroundColor: '#0B121C',
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: Brand.tactical,
    padding: Spacing.four,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  lockIcon: { fontSize: 26 },
  title: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  sub: { color: '#B8C4D0', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 2, marginBottom: 6 },
  btn: { backgroundColor: Brand.tactical, borderRadius: Spacing.two, paddingHorizontal: Spacing.five, paddingVertical: Spacing.two + 2 },
  btnText: { color: '#04080F', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
