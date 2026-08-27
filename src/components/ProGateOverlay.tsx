import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useIsAdmin } from '@/hooks/use-admin';
import { useIsPro } from '@/hooks/use-is-pro';

// Master kill switch — flip to true and OTA-publish once the Pro subscription
// (7-day trial via Google Play/App Store) has actually gone live in both
// stores. Until then this stays false so the gate never activates, no matter
// what any individual member's entitlement looks like.
//
// Flipped true 2026-08-20 after a real Google Play sandbox purchase test
// confirmed the full buy -> /api/iap/verify -> proExpiresAt unlock flow
// works end to end on Android.
const PRO_GATE_ENABLED = true;

// iOS purchase verification IS implemented server-side now
// (milbudgetbuddy-api's src/lib/apple-verify.ts cryptographically verifies
// the signedTransaction JWS via Apple's official app-store-server-library —
// no stub, no 501). This flag is just OFF because that path hasn't had a
// real sandbox purchase test on iOS yet (see PRO_GATE_ENABLED's comment
// above for what that looked like on Android before it was flipped on).
// Flip to `true` once an iOS sandbox buy -> verify -> proExpiresAt unlock
// has actually been exercised end to end.
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

  const allowed = ALWAYS_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const gated = GATE_ACTIVE_ON_THIS_PLATFORM && !isPro && !isAdmin && !allowed;

  // The gate dims and disables pointerEvents on the ENTIRE app content below
  // — including the bottom tab bar, since that's rendered inside `children`
  // too. This USED to send a signed-out member to /auth/sign-in first,
  // before they could even reach the paywall — Apple rejected that under
  // Guideline 5.1.1(v): registration can't be required before purchasing an
  // IAP that isn't itself account-based content. Always go straight to
  // /paywall now; paywall.tsx's own purchase flow silently creates an
  // anonymous session as needed (see auth.store.ts's ensureSignedIn) rather
  // than forcing a sign-in screen in front of the user.
  const unlockCopy = 'Start your 7-day free trial to unlock this screen — and everything else.';

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, opacity: gated ? 0.35 : 1 }} pointerEvents={gated ? 'none' : 'auto'}>
        {children}
      </View>

      {gated && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Pressable style={styles.card} onPress={() => router.push('/paywall' as any)}>
            <ThemedText style={styles.lockIcon}>🔒</ThemedText>
            <ThemedText style={styles.title}>MILBUDGETBUDDY PRO</ThemedText>
            <ThemedText style={styles.sub}>{unlockCopy}</ThemedText>
            <View style={styles.btn}>
              <ThemedText style={styles.btnText}>UNLOCK NOW</ThemedText>
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
