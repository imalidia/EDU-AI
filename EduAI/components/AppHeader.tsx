import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  onBack?: () => void;
}

export default function AppHeader({ showBack, title, onBack }: AppHeaderProps) {
  const theme = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={24} 
              color={theme.colors.onSurface} 
            />
          </TouchableOpacity>
        )}
        <Image
          source={require('../assets/images/Edu_AI__1_-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {title && (
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
  },
}); 