import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Keys for stored data
const OFFLINE_CACHE_PREFIX = 'eduai_offline_';
const PENDING_ACTIONS_KEY = 'eduai_pending_actions';

/**
 * Simplified offline helper that doesn't depend on NetInfo
 */
class OfflineHelper {
  // Always assume online
  private isOnline = true;
  private pendingActions: Array<{
    action: string;
    data: any;
    timestamp: number;
  }> = [];

  constructor() {
    this.loadInitialState();
    console.log('[OfflineHelper] Initialized in simplified mode');
  }

  /**
   * Load cached state from storage
   */
  private async loadInitialState() {
    try {
      // Load pending actions
      const pendingActionsJson = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (pendingActionsJson) {
        this.pendingActions = JSON.parse(pendingActionsJson);
      }
      console.log('[OfflineHelper] Loaded cached state, pending actions:', this.pendingActions.length);
    } catch (error) {
      console.error('[OfflineHelper] Error loading initial state:', error);
    }
  }

  /**
   * Add a pending action to be processed when back online
   */
  async addPendingAction(action: string, data: any) {
    try {
      this.pendingActions.push({
        action,
        data,
        timestamp: Date.now()
      });
      
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(this.pendingActions));
      console.log(`[OfflineHelper] Added pending action: ${action}`);
    } catch (error) {
      console.error('[OfflineHelper] Error adding pending action:', error);
    }
  }

  /**
   * Store data for offline access
   */
  async cacheData(key: string, data: any) {
    try {
      const cacheKey = `${OFFLINE_CACHE_PREFIX}${key}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log(`[OfflineHelper] Cached data for key: ${key}`);
    } catch (error) {
      console.error('[OfflineHelper] Error caching data:', error);
    }
  }

  /**
   * Retrieve cached data
   */
  async getCachedData(key: string): Promise<any> {
    try {
      const cacheKey = `${OFFLINE_CACHE_PREFIX}${key}`;
      const cachedJson = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedJson) {
        return null;
      }
      
      const cached = JSON.parse(cachedJson);
      console.log(`[OfflineHelper] Retrieved cached data for key: ${key}`);
      
      return cached.data;
    } catch (error) {
      console.error('[OfflineHelper] Error retrieving cached data:', error);
      return null;
    }
  }

  /**
   * Check if the device is currently online
   */
  isNetworkAvailable(): boolean {
    // Always return true to avoid network checks
    return true;
  }

  /**
   * Simple network check that always returns true
   */
  async checkNetworkStatus(): Promise<boolean> {
    return true;
  }
}

// Create a singleton instance
const offlineHelper = new OfflineHelper();

export default offlineHelper; 