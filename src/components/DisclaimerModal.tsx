import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';
import { ThemedText } from './themed-text';

// ── Daily motivational quotes by branch ──────────────────────────────────────

const QUOTES: Record<string, { text: string; author: string }[]> = {
  army: [
    { text: 'The more you sweat in training, the less you bleed in battle.', author: 'Army Proverb' },
    { text: 'This we\'ll defend.', author: 'U.S. Army Motto' },
    { text: 'Discipline is the soul of an army.', author: 'George Washington' },
    { text: 'Courage is not the absence of fear, but the triumph over it.', author: 'Nelson Mandela' },
    { text: 'An army of principles can penetrate where an army of soldiers cannot.', author: 'Thomas Paine' },
    { text: 'The soldier above all others prays for peace, for it is the soldier who must suffer the deepest wounds of war.', author: 'Gen. Douglas MacArthur' },
    { text: 'Leadership is the art of getting someone else to do something you want done because he wants to do it.', author: 'Gen. Dwight D. Eisenhower' },
  ],
  navy: [
    { text: 'Non sibi sed patriae — Not for self, but for country.', author: 'U.S. Navy Motto' },
    { text: 'A ship in harbor is safe, but that is not what ships are for.', author: 'John A. Shedd' },
    { text: 'Dare to be remarkable.', author: 'Naval Aviation Creed' },
    { text: 'The sea is dangerous and its storms terrible, but these obstacles have never been sufficient reason to remain ashore.', author: 'Ferdinand Magellan' },
    { text: 'A smooth sea never made a skilled sailor.', author: 'Franklin D. Roosevelt' },
    { text: 'The Navy is the first line of defense and the last line of retreat.', author: 'Theodore Roosevelt' },
    { text: 'I have not yet begun to fight.', author: 'John Paul Jones' },
  ],
  marines: [
    { text: 'Semper Fidelis — Always Faithful.', author: 'USMC Motto' },
    { text: 'The deadliest weapon in the world is a Marine and his rifle.', author: 'Gen. John "Black Jack" Pershing' },
    { text: 'Pain is weakness leaving the body.', author: 'Marine Corps Proverb' },
    { text: 'Every Marine is a rifleman.', author: 'Marine Corps Doctrine' },
    { text: 'No better friend, no worse enemy.', author: 'Gen. James Mattis' },
    { text: 'Uncommon valor was a common virtue.', author: 'Fleet Adm. Chester Nimitz' },
    { text: 'You\'ve got to fight for peace.', author: 'USMC Veteran Saying' },
  ],
  air_force: [
    { text: 'Aim High... Fly-Fight-Win.', author: 'U.S. Air Force Motto' },
    { text: 'Airpower is the most difficult of all forms of military force to measure or to see.', author: 'Winston Churchill' },
    { text: 'Speed, altitude, and maneuver — win the battle before it begins.', author: 'Air Force Doctrine' },
    { text: 'A superior pilot uses superior judgment to avoid situations that require superior skill.', author: 'Fighter Pilot Maxim' },
    { text: 'The will to win, the desire to succeed, the urge to reach your full potential — these are the keys that unlock the door to personal excellence.', author: 'Confucius' },
    { text: 'No guts, no glory.', author: 'Gen. Frederick Corbin Blesse' },
    { text: 'Fight to fly, fly to fight, fight to win.', author: 'USAF Fighter Pilot Creed' },
  ],
  space_force: [
    { text: 'Semper Supra — Always Above.', author: 'U.S. Space Force Motto' },
    { text: 'The Earth is the cradle of humanity, but mankind cannot stay in the cradle forever.', author: 'Konstantin Tsiolkovsky' },
    { text: 'We shall defend our planet.', author: 'Space Force Guardian Oath' },
    { text: 'The stars are not too far.', author: 'Space Force Vision' },
    { text: 'Curiosity is the engine of achievement.', author: 'Sir Ken Robinson' },
    { text: 'Space is not the final frontier — it is our next frontier.', author: 'Space Force Doctrine' },
    { text: 'We explore, we defend, we prevail.', author: 'Guardian Creed' },
  ],
  coast_guard: [
    { text: 'Semper Paratus — Always Ready.', author: 'U.S. Coast Guard Motto' },
    { text: 'You have to go out, but you don\'t have to come back.', author: 'USCG Old Surfmen Creed' },
    { text: 'The sea will test you and build you in ways you never expected.', author: 'USCG Tradition' },
    { text: 'Rescue is not a job — it\'s a calling.', author: 'Coast Guard Aviation Saying' },
    { text: 'Honor, respect, and devotion to duty.', author: 'USCG Core Values' },
    { text: 'We must be ready to sacrifice that others may live.', author: 'Coast Guard Heritage' },
    { text: 'Every second counts when lives are on the line.', author: 'USCG Rescue Swimmers' },
  ],
  default: [
    { text: 'The price of freedom is eternal vigilance.', author: 'Thomas Jefferson' },
    { text: 'In valor there is hope.', author: 'Tacitus' },
    { text: 'Courage is contagious. When a brave person takes a stand, the spines of others are stiffened.', author: 'Billy Graham' },
    { text: 'It is not the size of the dog in the fight, it is the size of the fight in the dog.', author: 'Mark Twain' },
    { text: 'A hero is someone who has given his or her life to something bigger than oneself.', author: 'Joseph Campbell' },
    { text: 'The strength of a warrior is not their weapon — it is their conviction.', author: 'Military Proverb' },
    { text: 'Those who stand for nothing fall for anything.', author: 'Alexander Hamilton' },
  ],
};

function getDailyQuote(branchKey: string): { text: string; author: string } {
  const pool = QUOTES[branchKey] ?? QUOTES.default;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return pool[dayOfYear % pool.length];
}

export function DisclaimerModal() {
  const tc = useThemeColors();
  const [acknowledged, setAcknowledged] = useState(false);
  const branch = useUserStore((s) => s.branch);

  const quote = useMemo(() => {
    const branchKey = branch ?? 'default';
    return getDailyQuote(branchKey);
  }, [branch]);

  if (acknowledged) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <View style={styles.accentBar} />
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.bodyContent}>

            <ThemedText style={styles.title}>IMPORTANT NOTICE</ThemedText>

            <View style={styles.eduBanner}>
              <ThemedText style={styles.eduText}>FOR EDUCATIONAL PURPOSES ONLY</ThemedText>
              <ThemedText style={styles.eduSig}>~Elo</ThemedText>
            </View>

            <ThemedText style={styles.section}>Not Financial Advice</ThemedText>
            <ThemedText style={[styles.body2, { color: tc.textSecondary }]}>
              MilBudgetBuddy provides educational tools and estimates only. Pay calculations,
              BAH amounts, TRICARE cost estimates, retirement projections, and all other
              outputs are approximations for informational purposes and may not reflect your
              actual entitlements or costs.
            </ThemedText>

            <ThemedText style={styles.section}>Branch Regulations Apply</ThemedText>
            <ThemedText style={[styles.body2, { color: tc.textSecondary }]}>
              While the Joint Travel Regulation (JTR) establishes baseline DoD policies,
              each branch of service maintains its own regulations that may differ. Always
              consult your branch-specific guidance and your unit S1 / Finance office before
              making decisions based on this app.
            </ThemedText>

            <ThemedText style={styles.section}>Official Sources</ThemedText>
            <ThemedText style={[styles.body2, { color: tc.textSecondary }]}>
              Verify your pay and benefits with your finance office, MyPay (dfas.mil),
              milConnect, or the appropriate military personnel system. Tax guidance should
              come from a qualified tax professional or MilTax (via Military OneSource).
            </ThemedText>

            <ThemedText style={styles.section}>No Liability</ThemedText>
            <ThemedText style={[styles.body2, { color: tc.textSecondary }]}>
              The developer assumes no responsibility for financial decisions made based on
              information provided by this app. Investment and insurance choices should be
              made in consultation with licensed professionals.
            </ThemedText>

            {/* Daily motivational quote */}
            <View style={[styles.quoteBox, { borderTopColor: tc.borderColor }]}>
              <ThemedText style={styles.quoteIcon}>❝</ThemedText>
              <ThemedText style={[styles.quoteText, { color: tc.textHint }]}>{quote.text}</ThemedText>
              <ThemedText style={styles.quoteAuthor}>— {quote.author}</ThemedText>
            </View>

          </ScrollView>
          <Pressable
            onPress={() => setAcknowledged(true)}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }]}>
            <ThemedText style={styles.btnText}>I UNDERSTAND — CONTINUE</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,8,15,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    backgroundColor: Brand.accent,
  },
  scrollArea: {
    maxHeight: 440,
  },
  bodyContent: {
    padding: Spacing.three,
    gap: 8,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: Brand.tactical,
    marginBottom: 8,
  },
  eduBanner: {
    backgroundColor: Brand.accent + '18',
    borderWidth: 1,
    borderColor: Brand.accent + '60',
    borderRadius: 3,
    paddingVertical: 10,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  eduText: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: Brand.accent,
  },
  eduSig: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.accent + 'AA',
    fontStyle: 'italic',
  },
  section: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Brand.accent,
    marginTop: 8,
  },
  body2: {
    fontSize: 13,
    lineHeight: 20,
  },
  quoteBox: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 6,
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 22,
    color: Brand.accent + '60',
    lineHeight: 24,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 11,
    color: Brand.accent + '90',
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  btn: {
    margin: Spacing.two,
    backgroundColor: Brand.accent,
    borderRadius: 3,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#04080F',
  },
});
