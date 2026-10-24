import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '../app/services/supabaseClient';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const LOCAL_USER_STORAGE_KEY = 'eduai_local_user';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  bypassLogin: () => Promise<void>;
  updateProfile: (data: { 
    first_name?: string; 
    last_name?: string; 
    avatar_url?: string;
    streak_count?: number;
    streak_last_date?: string;
    activity_days?: string[];
    longest_streak?: number;
    [key: string]: any;
  }) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signInWithPassword: async () => ({ error: new Error('Not implemented') }),
  signInWithEmail: async () => ({ success: false, error: 'Not implemented' }),
  signUp: async () => ({ error: new Error('Not implemented') }),
  signOut: async () => {},
  bypassLogin: async () => {},
  updateProfile: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);
  const pendingNavigation = useRef<'/' | '/(app)' | '/auth' | null>(null);
  const navigationInProgress = useRef(false);

  // Perform navigation safely to avoid loops
  const navigateSafely = (path: '/' | '/(app)' | '/auth') => {
    // Don't navigate to the same path we're already navigating to
    if (navigationInProgress.current) {
      pendingNavigation.current = path;
      return;
    }
    
    try {
      console.log(`[AuthContext] Navigating to: ${path}`);
      navigationInProgress.current = true;
      
      // Use setTimeout to break the render cycle
      setTimeout(() => {
        try {
          router.replace(path);
        } catch (error) {
          console.error('[AuthContext] Navigation error:', error);
        } finally {
          navigationInProgress.current = false;
          
          // Handle any pending navigation
          if (pendingNavigation.current) {
            const nextPath = pendingNavigation.current;
            pendingNavigation.current = null;
            navigateSafely(nextPath);
          }
        }
      }, 50);
    } catch (error) {
      console.error('[AuthContext] Error preparing navigation:', error);
      navigationInProgress.current = false;
    }
  };

  // Initial setup - only runs once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    let isMounted = true;
    console.log('[AuthContext] Setting up auth state');
    
    // Check active session
    const setupAuth = async () => {
      try {
        // Check if there is a saved local/bypass user first
        const savedLocalUser = await AsyncStorage.getItem(LOCAL_USER_STORAGE_KEY);
        if (savedLocalUser) {
          const parsedUser: User = JSON.parse(savedLocalUser);
          if (isMounted) {
            setUser(parsedUser);
            setSession({
              access_token: 'local-bypass-token',
              refresh_token: 'local-bypass-refresh',
              expires_in: 3600 * 24 * 365,
              token_type: 'bearer',
              user: parsedUser,
            });
            setIsLoading(false);
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Session error:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
          }
        } else {
          console.log('[AuthContext] Initial session check:', !!data.session);
          if (isMounted) {
            setSession(data.session);
            setUser(data.session?.user ?? null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error in auth setup:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log('[AuthContext] Auth state changed, session:', !!newSession);
      
      if (isMounted) {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user ?? null);
        } else {
          const savedLocalUser = await AsyncStorage.getItem(LOCAL_USER_STORAGE_KEY);
          if (!savedLocalUser) {
            setSession(null);
            setUser(null);
          }
        }
      }
    });
    
    // Cleanup subscription
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Google sign-in method
  const signIn = async () => {
    try {
      console.log('[AuthContext] Attempting Google sign-in');
      setIsLoading(true);
      
      const redirectUrl = makeRedirectUri({ 
        path: 'auth/callback'
      });
      console.log('[AuthContext] Redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true
        }
      });
      
      if (error) {
        console.error('[AuthContext] OAuth error:', error);
        throw error;
      }
      
      if (!data.url) {
        console.error('[AuthContext] No OAuth URL returned');
        throw new Error('No authentication URL returned');
      }
      
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success') {
        console.log('[AuthContext] OAuth success, refreshing session');
        await supabase.auth.refreshSession();
      } else {
        console.log('[AuthContext] OAuth cancelled or failed:', result.type);
      }
    } catch (error) {
      console.error('[AuthContext] Error in Google sign-in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password sign-in (renamed to avoid conflicts)
  const signInWithPassword = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting to sign in with password:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error.message);
        throw error;
      }
      
      console.log('[AuthContext] Sign in successful, session:', !!data.session);
      
      // Navigation will be handled by the auth state change listener
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting to sign in with email:', email);
      setIsLoading(true);

      const { getClientStorageMode } = require('../app/services/supabaseClient');
      if (getClientStorageMode() === 'local') {
        const localUser: User = {
          id: 'local-dev-user',
          app_metadata: {},
          user_metadata: {
            first_name: email.split('@')[0] || 'Student',
            last_name: '',
            streak_count: 1,
            longest_streak: 1,
            activity_days: [new Date().toISOString().split('T')[0]],
            streak_last_date: new Date().toISOString(),
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          email,
        };
        const localSession: Session = {
          access_token: 'local-bypass-token',
          refresh_token: 'local-bypass-refresh',
          expires_in: 3600 * 24 * 365,
          token_type: 'bearer',
          user: localUser,
        };
        await AsyncStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(localUser));
        setUser(localUser);
        setSession(localSession);
        return { success: true };
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign in error:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('[AuthContext] Sign in successful, session:', !!data.session);
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Attempting to sign up:', email);
      setIsLoading(true);

      const { getClientStorageMode } = require('../app/services/supabaseClient');
      if (getClientStorageMode() === 'local') {
        await signInWithEmail(email, password);
        return { error: null };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Sign up error:', error.message);
        throw error;
      }
      
      console.log('[AuthContext] Sign up successful');
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Sign up error:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    } finally {
      setIsLoading(false);
    }
  };

  const bypassLogin = async () => {
    const mockUser: User = {
      id: 'local-dev-user',
      app_metadata: {},
      user_metadata: {
        first_name: 'Student',
        last_name: '',
        streak_count: 1,
        longest_streak: 1,
        activity_days: [new Date().toISOString().split('T')[0]],
        streak_last_date: new Date().toISOString(),
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'student@eduai.app',
    };
    const mockSession: Session = {
      access_token: 'local-bypass-token',
      refresh_token: 'local-bypass-refresh',
      expires_in: 3600 * 24 * 365,
      token_type: 'bearer',
      user: mockUser,
    };
    await AsyncStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    setSession(mockSession);
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out');
      setIsLoading(true);
      
      // Reset navigation flag
      navigationInProgress.current = false;
      
      await AsyncStorage.removeItem(LOCAL_USER_STORAGE_KEY);
      setUser(null);
      setSession(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
      }
      
      // The auth state change listener will handle redirection
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const bucketExists = async (bucketName: string): Promise<boolean> => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      return buckets?.some(bucket => bucket.name === bucketName) || false;
    } catch (error) {
      console.error('Error checking if bucket exists:', error);
      return false;
    }
  };

  const updateProfile = async (data: { 
    first_name?: string; 
    last_name?: string; 
    avatar_url?: string;
    streak_count?: number;
    streak_last_date?: string;
    activity_days?: string[];
    longest_streak?: number;
    [key: string]: any;
  }) => {
    try {
      if (!user) {
        console.error('Update profile called but no user is logged in');
        return { error: new Error('No user logged in') };
      }

      console.log('Updating profile for user:', user.id);

      if (user.id === 'local-dev-user') {
        const updatedUser: User = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            ...data,
          },
        };
        await AsyncStorage.setItem(LOCAL_USER_STORAGE_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        return { error: null };
      }
      
      let finalData = { ...data };
      let avatarUrl = data.avatar_url;

      // If avatar_url starts with file://, it's a local file that needs to be uploaded to storage
      if (data.avatar_url && data.avatar_url.startsWith('file://')) {
        try {
          console.log('Uploading profile image to storage...');
          
          // Upload to Supabase Storage instead of metadata
          const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
          
          // Fetch the file
          const response = await fetch(data.avatar_url);
          const blob = await response.blob();
          
          // Try to get bucket info first
          try {
            // First make sure avatar bucket exists
            const avatarBucketExists = await bucketExists('avatars');
            
            // Create bucket if needed
            if (!avatarBucketExists) {
              console.log('Creating avatars bucket...');
              const { error: createError } = await supabase.storage.createBucket('avatars', {
                public: true,
              });
              
              if (createError) {
                console.error('Failed to create bucket:', createError);
                throw createError;
              }
              
              // Make sure new bucket is public
              await supabase.storage.updateBucket('avatars', {
                public: true,
              });
            }
            
            // Now try to upload the file
            console.log('Uploading image to storage...');
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: true,
              });
              
            if (uploadError) {
              console.error('Upload failed:', uploadError);
              throw uploadError;
            }
            
            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
              
            if (!publicUrlData?.publicUrl) {
              throw new Error('Failed to get public URL for the uploaded file');
            }
            
            avatarUrl = publicUrlData.publicUrl;
            console.log('Upload successful, image URL:', avatarUrl);
            
          } catch (storageError) {
            console.error('Storage operation failed:', storageError);
            // Fallback: Just update profile info without avatar
            console.log('Continuing without avatar...');
            delete finalData.avatar_url;
            // Don't return error yet - try to update profile first
          }
        } catch (fileError) {
          console.error('Failed to process file:', fileError);
          // Continue with profile update but without avatar
          delete finalData.avatar_url;
          return { error: new Error('Profile info updated, but could not process avatar file') };
        }
      }
      
      // Update the avatar_url to the storage URL if we have one
      if (avatarUrl && avatarUrl !== data.avatar_url) {
        finalData.avatar_url = avatarUrl;
      }

      // Log the metadata we're about to update
      console.log('Current metadata:', user.user_metadata);
      console.log('Updating with:', finalData);

      // Check if we're updating with or without the avatar
      const updatingWithoutAvatar = data.avatar_url && !finalData.avatar_url;

      // Perform the profile update
      const { error } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          ...finalData
        }
      });

      if (error) {
        console.error('Error from Supabase updateUser:', error);
        return { error };
      }

      // If we had to remove the avatar but the profile update succeeded
      if (updatingWithoutAvatar) {
        console.log('Profile updated successfully, but without the avatar');
        return { 
          error: new Error('Profile info updated, but could not save the photo. Try using a smaller image.') 
        };
      }

      console.log('Profile updated successfully with all data');
      return { error: null };
    } catch (error) {
      console.error('Exception in updateProfile:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signInWithPassword,
    signInWithEmail,
    signUp,
    signOut,
    bypassLogin,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 