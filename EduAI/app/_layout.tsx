import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Stack, SplashScreen as RouterSplashScreen } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../contexts/AuthContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { StreakProvider } from '../contexts/StreakContext';
import { NotesProvider } from '../contexts/NotesContext';
import { FlashcardsProvider } from '../contexts/FlashcardsContext';
import { theme } from '../theme';
import { View } from 'react-native';

// Keep the splash screen visible while we fetch resources
try {
  SplashScreen.preventAutoHideAsync();
  RouterSplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn("Error preventing splash screen hide:", e);
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const appInitialized = useRef(false);

  useEffect(() => {
    if (appInitialized.current) return;
    appInitialized.current = true;

    async function prepare() {
      try {
        // Minimal delay to ensure components have time to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        // Silently ignore errors
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hide splash screen when layout is ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
        await RouterSplashScreen.hideAsync();
      } catch (e) {
        // Ignore errors
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <SettingsProvider>
          <AuthProvider>
            <StreakProvider>
              <NotesProvider>
                <FlashcardsProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: theme.colors.background },
                    }}
                  >
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(app)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="library" options={{ headerShown: false }} />
                    <Stack.Screen name="profile" options={{ headerShown: false }} />
                    <Stack.Screen name="streak" options={{ headerShown: false }} />
                    <Stack.Screen name="notes/create" options={{ headerShown: false }} />
                    <Stack.Screen name="notes/edit/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="flashcards/create" options={{ headerShown: false }} />
                    <Stack.Screen name="flashcards/process" options={{ headerShown: false }} />
                    <Stack.Screen name="flashcards/view" options={{ headerShown: false }} />
                    <Stack.Screen name="flashcards/deck/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="docs/upload" options={{ headerShown: false }} />
                    <Stack.Screen name="docs/process" options={{ headerShown: false }} />
                  </Stack>
                </FlashcardsProvider>
              </NotesProvider>
            </StreakProvider>
          </AuthProvider>
        </SettingsProvider>
      </View>
    </PaperProvider>
  );
}
