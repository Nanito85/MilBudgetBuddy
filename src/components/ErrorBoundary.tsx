import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error?: Error }

function ErrorFallback({ error, onRestart }: { error?: Error; onRestart: () => void }) {
  const tc = useThemeColors();
  return (
    <View style={[s.container, { backgroundColor: tc.background }]}>
      <ThemedText style={s.icon}>⚠️</ThemedText>
      <ThemedText style={[s.title, { color: tc.textPrimary }]}>SYSTEM ERROR</ThemedText>
      <ThemedText style={[s.body, { color: tc.textSecondary }]}>
        An unexpected error occurred. Your data is safe — tap below to restart.
      </ThemedText>
      <Pressable onPress={onRestart} style={s.btn}>
        <ThemedText style={s.btnText}>RESTART SCREEN</ThemedText>
      </Pressable>
      {__DEV__ && error && (
        <ThemedText style={[s.debug, { color: tc.textMuted }]}>{error.message}</ThemedText>
      )}
    </View>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Could send to Sentry here: captureException(error)
    console.error('[MilBudgetBuddy] Uncaught error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <ErrorFallback
        error={this.state.error}
        onRestart={() => this.setState({ hasError: false })}
      />
    );
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.four, gap: Spacing.three,
  },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  body: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btn: {
    backgroundColor: Brand.tactical, borderRadius: 6,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two + 4,
  },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  debug: { fontSize: 10, textAlign: 'center', marginTop: Spacing.two },
});
