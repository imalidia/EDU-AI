import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import supabase from '../app/services/supabaseClient';

interface StreakContextType {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  activeDays: number[];
  isLoading: boolean;
  checkInToday: () => Promise<void>;
  refreshStreakData: () => Promise<void>;
}

const StreakContext = createContext<StreakContextType>({
  currentStreak: 0,
  longestStreak: 0,
  totalDays: 0,
  activeDays: [],
  isLoading: true,
  checkInToday: async () => {},
  refreshStreakData: async () => {},
});

export const useStreak = () => useContext(StreakContext);

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [activeDays, setActiveDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add ref to track initialization and current user
  const initialized = useRef(false);
  const currentUserId = useRef<string | null>(null);

  // Get user streak data from metadata
  const getUserStreakData = () => {
    if (!user) return null;
    
    try {
      // Get streak data from user metadata
      const metadata = user.user_metadata || {};
      const streakData = {
        streak_count: metadata.streak_count || 0,
        streak_last_date: metadata.streak_last_date || null,
        activity_days: metadata.activity_days || [],
        longest_streak: metadata.longest_streak || 0
      };
      
      return streakData;
    } catch (error) {
      console.error('Error in getUserStreakData:', error);
      return null;
    }
  };

  // Update streak data in user metadata
  const updateStreakData = async (
    streakCount: number,
    lastDate: string,
    activityDays: string[],
    longestStreak: number
  ) => {
    if (!user) return;

    try {
      // Update user metadata with streak information
      const result = await updateProfile({
        streak_count: streakCount,
        streak_last_date: lastDate,
        activity_days: activityDays,
        longest_streak: longestStreak
      });

      if (result.error) {
        console.error('Error updating streak data:', result.error);
      }
    } catch (error) {
      console.error('Error in updateStreakData:', error);
    }
  };

  // Check if a date is today
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if a date is yesterday
  const isYesterday = (dateString: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const date = new Date(dateString);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  };

  // Check in for today
  const checkInToday = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userData = getUserStreakData();
      if (!userData) {
        setIsLoading(false);
        return;
      }
      
      const today = new Date().toISOString();
      const lastDate = userData.streak_last_date;
      
      // Initialize activity days if not exist
      let activityDays = userData.activity_days || [];
      
      // Add today to activity days if not already present
      const todayStr = new Date().toISOString().split('T')[0];
      if (!activityDays.includes(todayStr)) {
        activityDays.push(todayStr);
      }
      
      let newStreakCount = userData.streak_count || 0;
      let newLongestStreak = userData.longest_streak || 0;
      
      // If already checked in today, do nothing
      if (lastDate && isToday(lastDate)) {
        setIsLoading(false);
        return;
      }
      
      // If checked in yesterday, continue streak
      if (lastDate && isYesterday(lastDate)) {
        newStreakCount += 1;
      } 
      // If hasn't checked in for more than a day, reset streak
      else if (!lastDate || !isYesterday(lastDate)) {
        newStreakCount = 1;
      }
      
      // Update longest streak if needed
      if (newStreakCount > newLongestStreak) {
        newLongestStreak = newStreakCount;
      }
      
      // Update user metadata
      await updateStreakData(newStreakCount, today, activityDays, newLongestStreak);
      
      // Update local state
      setCurrentStreak(newStreakCount);
      setLongestStreak(newLongestStreak);
      setTotalDays(activityDays.length);
      
      // Generate active days for current month
      generateActiveMonthDays(activityDays);
      
    } catch (error) {
      console.error('Error in checkInToday:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate active days for the calendar
  const generateActiveMonthDays = (activityDays: string[]) => {
    if (!activityDays || !Array.isArray(activityDays)) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Filter activities for current month
    const thisMonthActivities = activityDays.filter(dateStr => {
      const date = new Date(dateStr);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    // Convert to day of month numbers
    const activeDaysInMonth = thisMonthActivities.map(dateStr => 
      new Date(dateStr).getDate()
    );
    
    setActiveDays(activeDaysInMonth);
  };

  // Refresh streak data
  const refreshStreakData = async () => {
    if (!user) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setTotalDays(0);
      setActiveDays([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const userData = getUserStreakData();
      if (!userData) {
        setIsLoading(false);
        return;
      }
      
      // Set state values
      setCurrentStreak(userData.streak_count || 0);
      setLongestStreak(userData.longest_streak || 0);
      setTotalDays(userData.activity_days?.length || 0);
      
      // Generate active days for current month
      generateActiveMonthDays(userData.activity_days || []);
      
      // Check if we need to reset streak (if last check-in was more than a day ago)
      const lastDate = userData.streak_last_date;
      if (lastDate) {
        // If last check-in was not yesterday or today, reset streak
        if (!isToday(lastDate) && !isYesterday(lastDate)) {
          // Only update if streak is not already 0
          if (userData.streak_count > 0) {
            await updateStreakData(0, lastDate, userData.activity_days || [], userData.longest_streak || 0);
            setCurrentStreak(0);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in refreshStreakData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data when user changes
  useEffect(() => {
    // Only refresh data if user changed or on first render
    const userId = user?.id || null;
    if (!initialized.current || userId !== currentUserId.current) {
      initialized.current = true;
      currentUserId.current = userId;
      refreshStreakData();
    }
  }, [user]);

  return (
    <StreakContext.Provider
      value={{
        currentStreak,
        longestStreak,
        totalDays,
        activeDays,
        isLoading,
        checkInToday,
        refreshStreakData,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
} 