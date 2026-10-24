import React, { useEffect, useRef } from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../theme';
import { NotesProvider } from '../../contexts/NotesContext';
import { FlashcardsProvider } from '../../contexts/FlashcardsContext';
import { StreakProvider } from '../../contexts/StreakContext';

export default function AppLayout() {
  const { user, session, isLoading } = useAuth();
  const navigationComplete = useRef(false);
  const mounted = useRef(false);

  // Check authentication only on mount and when auth state changes
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    // Only handle redirection once
    if (!isLoading && !user && !session && !navigationComplete.current) {
      navigationComplete.current = true;
      console.log('[AppLayout] No user or session, redirect will happen after render');
    }
  }, [isLoading, user, session]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.onBackground }}>Loading...</Text>
      </View>
    );
  }

  // Handle redirection without directly returning a redirect component mid-render
  // which could lead to infinite update cycles in some cases
  if (!user && !session) {
    return <RedirectOnce path="/auth" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

// Custom component to handle redirect once
function RedirectOnce({ path }: { path: '/auth' | '/' | '/(app)' }) {
  const redirected = useRef(false);
  
  useEffect(() => {
    if (!redirected.current) {
      redirected.current = true;
      console.log(`[RedirectOnce] Redirecting to ${path}`);
    }
  }, [path]);
  
  return <Redirect href={path} />;
} 