import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function AuthScreen() {
  const { bypassLogin } = useAuth();
  const { switchStorageMode } = useSettings();

  const navigateTo = (path: 'login' | 'signup') => {
    router.push(`/auth/${path}` as any);
  };

  const handleUseLocalStorage = async () => {
    await switchStorageMode('local');
    await bypassLogin();
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
      />
      
      <View style={styles.logoContainer}>
        <Logo variant="color" size="large" />
        <Text style={styles.appName}>Edu AI</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.heading}>All the best tools{'\n'}for learning</Text>
        <Text style={styles.subheading}>Note Generator</Text>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigateTo('login')}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor="#2563EB"
          >
            Log in
          </Button>
          <Button
            mode="contained"
            onPress={() => navigateTo('signup')}
            style={styles.signupButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor="#10B981"
          >
            Sign up
          </Button>
          <Button
            mode="outlined"
            icon="database-outline"
            onPress={handleUseLocalStorage}
            style={styles.signupButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            textColor="#10B981"
          >
            Use Local Storage (Offline Mode)
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 250,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 40,
  },
  subheading: {
    fontSize: 24,
    color: '#10B981',
    marginBottom: 48,
  },
  buttonContainer: {
    gap: 16,
  },
  loginButton: {
    borderRadius: 12,
  },
  signupButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    marginVertical: 8,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
    color: '#10B981',
  },
}); 