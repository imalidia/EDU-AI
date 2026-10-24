import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../components/Logo';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithEmail, bypassLogin, isLoading: authLoading, session, user } = useAuth();

  // Add more debugging to track auth state
  useEffect(() => {
    console.log('[LoginScreen] Auth state changed - Session:', !!session, 'User:', !!user);
    
    if (session && user) {
      console.log('[LoginScreen] User authenticated, redirecting to app home');
      
      // Use a timeout to ensure the navigation happens after the component is fully mounted
      const timer = setTimeout(() => {
        console.log('[LoginScreen] Executing redirect to /(app)');
        try {
          router.replace('/(app)');
        } catch (err) {
          console.error('[LoginScreen] Navigation error:', err);
          
          // Try again with a different route
          try {
            console.log('[LoginScreen] Trying fallback route /');
            router.replace('/');
          } catch (fallbackErr) {
            console.error('[LoginScreen] Fallback navigation failed:', fallbackErr);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [session, user]);

  const handleSignIn = async () => {
    // Clear any previous errors
    setError(null);
    
    // Validate inputs
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[LoginScreen] Attempting to sign in with email:', email);
      
      // Call the signInWithEmail function from AuthContext
      const { success, error: signInError } = await signInWithEmail(email, password);
      
      if (!success && signInError) {
        console.log('[LoginScreen] Sign in error:', signInError);
        setError(signInError);
        
        // Show an alert to make the error more visible
        Alert.alert(
          'Login Failed',
          signInError,
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('[LoginScreen] Sign in successful, waiting for session update');
      // The session change will trigger the useEffect to handle navigation
      
      // Force navigation after a timeout as a fallback
      setTimeout(() => {
        if (!session) {
          console.log('[LoginScreen] Session not updated after 1s, forcing navigation');
          router.replace('/(app)');
        }
      }, 1000);
      
    } catch (err) {
      console.error('[LoginScreen] Unexpected login error:', err);
      setError('An unexpected error occurred');
      Alert.alert(
        'Login Error',
        'An unexpected error occurred. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    router.push(path as any);
  };
  
  // Show loading UI while authentication is in progress
  const isLoadingAuth = loading || authLoading;
  
  // DEBUG: Add button to bypass login in dev mode
  const handleBypassLogin = async () => {
    console.log('[LoginScreen] DEBUG: Bypassing login');
    await bypassLogin();
    router.replace('/(app)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0)']}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.4 }}
        />
        
        <View style={styles.logoContainer}>
          <Logo variant="color" size="medium" />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.heading}>Sign in</Text>
          <Text style={styles.subheading}>Welcome back</Text>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            outlineColor="rgba(255, 255, 255, 0.3)"
            activeOutlineColor="#2563EB"
            textColor="#FFFFFF"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            disabled={isLoadingAuth}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            outlineColor="rgba(255, 255, 255, 0.3)"
            activeOutlineColor="#2563EB"
            textColor="#FFFFFF"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            disabled={isLoadingAuth}
          />

          <Button
            mode="contained"
            onPress={handleSignIn}
            style={styles.signInButton}
            contentStyle={styles.buttonContent}
            loading={isLoadingAuth}
            disabled={isLoadingAuth || !email || !password}
            buttonColor="#2563EB"
          >
            {isLoadingAuth ? 'Signing in...' : 'Sign in'}
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Button
              mode="text"
              onPress={() => navigateTo('/auth/signup')}
              textColor="#2563EB"
              compact
              disabled={isLoadingAuth}
            >
              Sign up
            </Button>
          </View>
          
          {/* DEBUG: Development bypass button */}
          <Button
            mode="outlined"
            onPress={handleBypassLogin}
            style={styles.debugButton}
          >
            DEBUG: Bypass Login
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'space-between',
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
    marginTop: 60,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
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
  },
  subheading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 40,
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  signInButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  debugButton: {
    marginTop: 20,
    borderColor: '#FF6B6B',
  },
}); 