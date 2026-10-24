import supabaseClient from './supabaseClient';
import { User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache key for storing user data
const USER_CACHE_KEY = 'edu_ai_user_cache';

// Initialize with a null user
let cachedUser: User | null = null;

/**
 * Authentication service for handling user sessions and authentication
 */
class AuthService {
  /**
   * Get the current user, first checking cache, then session, with fallback
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('[AuthService] Getting current user...');
      
      // First check memory cache
      if (cachedUser) {
        console.log('[AuthService] Returning cached user');
        return cachedUser;
      }
      
      // Then try AsyncStorage cache
      try {
        const cachedUserData = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cachedUserData) {
          const parsedUser = JSON.parse(cachedUserData);
          cachedUser = parsedUser;
          console.log('[AuthService] Returning user from AsyncStorage cache');
          return parsedUser;
        }
      } catch (cacheError) {
        console.warn('[AuthService] Error reading user from cache:', cacheError);
      }
      
      // Then try getting from Supabase
      const { data, error } = await supabaseClient.auth.getUser();
      
      if (error) {
        console.error('[AuthService] Error getting user:', error);
        return null;
      }
      
      if (data?.user) {
        // Cache the user data
        cachedUser = data.user;
        try {
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
        } catch (cacheError) {
          console.warn('[AuthService] Error caching user:', cacheError);
        }
        
        console.log('[AuthService] Returning user from Supabase');
        return data.user;
      }
      
      console.log('[AuthService] No authenticated user found');
      return null;
    } catch (error) {
      console.error('[AuthService] Unexpected error in getCurrentUser:', error);
      
      // Return an anonymous user as fallback to prevent app crashes
      return this.getAnonymousUser();
    }
  }
  
  /**
   * Check if user is logged in, with fallback for offline or error states
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      console.error('[AuthService] Error checking login status:', error);
      // Fallback to true to prevent login screens when there's an error
      // This ensures the app remains usable even if auth is having issues
      return true;
    }
  }
  
  /**
   * Create an anonymous user object for offline or error fallback
   */
  private getAnonymousUser(): User {
    // Create a temporary user to allow app functionality even if auth fails
    const tempId = `anonymous-${Date.now()}`;
    console.log('[AuthService] Creating anonymous user with ID:', tempId);
    
    return {
      id: tempId,
      app_metadata: {},
      user_metadata: {
        name: 'Anonymous User',
        avatar_url: undefined
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: '',
      email: '',
      phone: '',
      confirmed_at: undefined,
      email_confirmed_at: undefined,
      phone_confirmed_at: undefined,
      last_sign_in_at: undefined,
      updated_at: undefined,
      identities: []
    };
  }
  
  /**
   * Clear all user caches when signing out
   */
  async clearUserCache() {
    cachedUser = null;
    try {
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      console.log('[AuthService] User cache cleared');
    } catch (error) {
      console.error('[AuthService] Error clearing user cache:', error);
    }
  }
  
  /**
   * Sign out the user
   */
  async signOut() {
    try {
      console.log('[AuthService] Signing out user...');
      await this.clearUserCache();
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('[AuthService] Error signing out:', error);
        return { success: false, error };
      }
      
      console.log('[AuthService] User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('[AuthService] Unexpected error in signOut:', error);
      return { success: false, error };
    }
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService; 