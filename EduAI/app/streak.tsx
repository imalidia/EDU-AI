import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Text, Button, Surface, Avatar } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useStreak } from '../contexts/StreakContext';
import { theme } from '../theme';

// Get screen dimensions
const { width } = Dimensions.get('window');
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarDayProps {
  date: number;
  isActive: boolean;
  isToday: boolean;
  month: string;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ date, isActive, isToday, month }) => {
  return (
    <View style={[
      styles.calendarDay,
      isActive && styles.activeDay,
      isToday && styles.todayDay
    ]}>
      <Text style={[
        styles.calendarDayText,
        isActive && styles.activeDayText,
        isToday && styles.todayDayText
      ]}>
        {date}
      </Text>
      {isToday && (
        <Text style={styles.monthText}>{month}</Text>
      )}
    </View>
  );
};

export default function StreakScreen() {
  const { 
    currentStreak, 
    longestStreak, 
    totalDays, 
    activeDays, 
    isLoading, 
    checkInToday,
    refreshStreakData 
  } = useStreak();
  
  useEffect(() => {
    // Refresh streak data when component mounts
    refreshStreakData();
  }, []);
  
  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: CalendarDayProps[] = [];
    
    // Get month name abbreviation
    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'short' });
    
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: i,
        isActive: activeDays.includes(i),
        isToday: i === currentDate,
        month: i === 1 ? monthName : ''
      });
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#FF4500', '#DC143C']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading streak data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FF4500', '#DC143C']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Streak</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Main Content */}
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
        {/* Streak Section */}
        <View style={styles.streakContainer}>
          <View style={styles.streakCircle}>
            <Text style={styles.streakCount}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>DAY STREAK</Text>
          </View>
          
          <MaterialCommunityIcons 
            name="fire" 
            size={80} 
            color="#FFD700" 
            style={styles.fireIcon}
          />
        </View>
        
        {/* Streak Stats */}
        <Surface style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
          </View>
        </Surface>
        
        {/* Calendar Section */}
        <Surface style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>Activity Calendar</Text>
          
          {/* Days of Week Header */}
          <View style={styles.daysOfWeek}>
            {DAYS_OF_WEEK.map((day) => (
              <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {generateCalendarDays().map((day, index) => (
              <CalendarDay 
                key={index} 
                date={day.date} 
                isActive={day.isActive} 
                isToday={day.isToday}
                month={day.month}
              />
            ))}
          </View>
        </Surface>
        
        {/* Motivation Section */}
        <Surface style={styles.motivationCard}>
          <Text style={styles.motivationTitle}>Keep it up!</Text>
          <Text style={styles.motivationText}>
            You're on a {currentStreak} day streak. Continue learning daily to maintain your progress.
          </Text>
          <Button
            mode="contained"
            style={styles.studyButton}
            labelStyle={styles.buttonLabel}
            onPress={checkInToday}
            icon="check-circle"
            buttonColor="#FF4500"
          >
            Check In Today
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  streakContainer: {
    alignItems: 'center',
    marginVertical: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  streakCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  streakCount: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  streakLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
  },
  fireIcon: {
    position: 'absolute',
    top: -25,
    right: width / 2 - 120,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.outline,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayOfWeekText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    width: (width - 64) / 7,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: (width - 64) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  activeDay: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
    borderRadius: 20,
  },
  activeDayText: {
    color: '#FF4500',
    fontWeight: 'bold',
  },
  todayDay: {
    backgroundColor: '#FF4500',
    borderRadius: 20,
  },
  todayDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 10,
    color: '#FFFFFF',
    position: 'absolute',
    top: 2,
    right: 2,
  },
  motivationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
    lineHeight: 20,
  },
  studyButton: {
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
}); 