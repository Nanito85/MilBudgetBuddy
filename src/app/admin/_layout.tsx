import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useIsAdmin } from '@/hooks/use-admin';
import { useAuthStore } from '@/store/auth.store';

export default function AdminLayout() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const { isAdmin, resolving } = useIsAdmin();

  useEffect(() => {
    if (!user) { router.replace('/auth/sign-in' as any); return; }
  }, [user]);

  useEffect(() => {
    if (!resolving && !isAdmin) { router.replace('/' as any); }
  }, [resolving, isAdmin]);

  // Render nothing until we have a definitive answer — prevents flash of admin UI
  if (resolving || !isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: '#04080F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#3D6080" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#04080F' },
      }}
    />
  );
}
