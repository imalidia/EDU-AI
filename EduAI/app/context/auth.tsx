import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { openAuthSessionAsync, maybeCompleteAuthSession } from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import { supabaseClient } from '../services/supabaseClient';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// Initialize WebBrowser
maybeCompleteAuthSession();

const SUPABASE_AUTH_TOKEN_KEY = 'supabase-auth-token';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isLoggedIn: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  signIn: async () => {},
  signInWithEmail: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  isLoggedIn: false,
  refreshSession: async () => {},
});

// This hook can be used to access the user info.
export function useAuth() {
  return useContext(AuthContext);
}

// This wrapper provides auth state to the rest of the app
export function AuthProvider(props: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    console.log('[Auth] Setting up auth listener...');
    
    try {
      const { data } = supabaseClient.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log(`[Auth] Auth state changed: ${event}`);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setIsLoggedIn(!!newSession);

          if (event === 'SIGNED_OUT') {
            // Delete token on sign out
            if (Platform.OS !== 'web') {
              await SecureStore.deleteItemAsync(SUPABASE_AUTH_TOKEN_KEY);
              await AsyncStorage.removeItem(SUPABASE_AUTH_TOKEN_KEY);
            }
            // Navigate to sign-in screen
            router.replace('/sign-in');
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Handle sign in (save token to SecureStore or AsyncStorage)
            const token = newSession?.access_token ?? '';
            if (Platform.OS !== 'web' && token) {
              try {
                await SecureStore.setItemAsync(SUPABASE_AUTH_TOKEN_KEY, token);
              } catch (error) {
                // Fallback to AsyncStorage if SecureStore fails
                await AsyncStorage.setItem(SUPABASE_AUTH_TOKEN_KEY, token);
              }
            }
          }
        }
      );

      // Initial session check
      getInitialSession();

      return () => {
        data.subscription.unsubscribe();
      };
    } catch (error) {
      console.error('[Auth] Error setting up auth listener:', error);
      setIsLoading(false);
      
      // Show error to user
      Alert.alert(
        'Authentication Error',
        'There was a problem connecting to the authentication service. Some features may be unavailable.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  async function getInitialSession() {
    try {
      setIsLoading(true);
      console.log('[Auth] Checking for existing session...');
      
      // Get session from SecureStore or fallback to AsyncStorage
      let storedToken = '';
      if (Platform.OS !== 'web') {
        try {
          storedToken = await SecureStore.getItemAsync(SUPABASE_AUTH_TOKEN_KEY) || '';
        } catch (error) {
          storedToken = await AsyncStorage.getItem(SUPABASE_AUTH_TOKEN_KEY) || '';
        }
      }

      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('[Auth] Error getting session:', error);
        router.replace('/sign-in');
        return;
      }

      console.log('[Auth] Session exists:', !!data?.session);
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsLoggedIn(true);
      } else {
        // No session, navigate to sign-in
        router.replace('/sign-in');
      }
    } catch (error) {
      console.error('[Auth] Unexpected error in getInitialSession:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshSession() {
    try {
      console.log('[Auth] Refreshing session...');
      setIsLoading(true);
      
      const { data, error } = await supabaseClient.auth.refreshSession();
      
      if (error) {
        console.error('[Auth] Error refreshing session:', error);
        return;
      }
      
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsLoggedIn(true);
        console.log('[Auth] Session refreshed successfully');
      } else {
        console.warn('[Auth] No session after refresh');
        setSession(null);
        setUser(null);
        setIsLoggedIn(false);
        router.replace('/sign-in');
      }
    } catch (error) {
      console.error('[Auth] Unexpected error in refreshSession:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn() {
    try {
      setIsLoading(true);
      const redirectUrl = makeRedirectUri();
      console.log('[Auth] Redirect URL:', redirectUrl);

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('[Auth] OAuth error:', error);
        Alert.alert('Sign In Error', 'Failed to start Google authentication.');
        return;
      }

      const authUrl = data?.url;
      if (!authUrl) {
        console.error('[Auth] No auth URL returned');
        Alert.alert('Sign In Error', 'Authentication URL not received.');
        return;
      }

      // Use direct import instead of namespace
      const result = await openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success') {
        const url = result.url;
        try {
          await supabaseClient.auth.setSession({
            access_token: url.split('#')[1].split('&')[0].split('=')[1],
            refresh_token: url.split('refresh_token=')[1].split('&')[0],
          });
        } catch (error) {
          console.error('[Auth] Error setting session from URL', error);
          Alert.alert('Sign In Error', 'Failed to complete authentication.');
        }
      } else if (result.type === 'cancel') {
        console.log('[Auth] User cancelled sign in');
      } else {
        console.error('[Auth] Sign in error:', result.type);
        Alert.alert('Sign In Error', 'Authentication process was dismissed or failed.');
      }
    } catch (error) {
      console.error('[Auth] Error in signIn:', error);
      Alert.alert('Sign In Error', 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithEmail(email: string, password: string) {
    try {
      setIsLoading(true);
      console.log('[Auth] Signing in with email...');
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign in error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsLoggedIn(true);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Sign in failed without error' 
      };
    } catch (error) {
      console.error('[Auth] Unexpected error in signInWithEmail:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(email: string, password: string) {
    try {
      setIsLoading(true);
      console.log('[Auth] Signing up with email:', email);
      
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Sign up error:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      console.log('[Auth] Sign up response:', data);
      
      // If email confirmation is required, we won't have a session yet
      if (data?.user && !data?.session) {
        console.log('[Auth] Sign up successful, email confirmation required');
        return { 
          success: true,
          error: 'Please check your email to confirm your account' 
        };
      }

      // If we have a session, the user is signed in
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsLoggedIn(true);
        
        // Save token
        const token = data.session.access_token;
        if (Platform.OS !== 'web' && token) {
          try {
            await SecureStore.setItemAsync(SUPABASE_AUTH_TOKEN_KEY, token);
          } catch (error) {
            await AsyncStorage.setItem(SUPABASE_AUTH_TOKEN_KEY, token);
          }
        }
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Unexpected response from server' 
      };
    } catch (error) {
      console.error('[Auth] Unexpected error in signUp:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      console.log('[Auth] Signing out...');
      
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out error:', error);
        return;
      }
      
      setSession(null);
      setUser(null);
      setIsLoggedIn(false);
      
      // Clean up stored tokens
      if (Platform.OS !== 'web') {
        try {
          await SecureStore.deleteItemAsync(SUPABASE_AUTH_TOKEN_KEY);
        } catch (secureStoreError) {
          console.warn('[Auth] Error cleaning SecureStore:', secureStoreError);
        }
        
        try {
          await AsyncStorage.removeItem(SUPABASE_AUTH_TOKEN_KEY);
        } catch (asyncStorageError) {
          console.warn('[Auth] Error cleaning AsyncStorage:', asyncStorageError);
        }
      }
      
      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Unexpected error in signOut:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const value = {
    session,
    user,
    isLoading,
    signIn,
    signInWithEmail,
    signUp,
    signOut,
    isLoggedIn,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  );
} 