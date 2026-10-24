import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export default function SignInScreen() {
  const { signIn, signInWithEmail, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signIn();
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    }
  };

  const handleEmailSignIn = async () => {
    setError(null);
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      const result = await signInWithEmail(email, password);
      if (!result.success) {
        setError(result.error || 'Failed to sign in. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setError(null);
      const result = await signInWithEmail('demo@eduai.com', 'demo123');
      if (!result.success) {
        setError(result.error || 'Failed to sign in with demo account.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/icon.png')}
              style={styles.logo}
            />
            <Text style={styles.logoText}>Edu AI</Text>
          </View>
          
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subText}>Sign in to continue</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              disabled={isLoading}
              left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword}
              disabled={isLoading}
              left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  color={theme.colors.primary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
          </View>
          
          <Button
            mode="contained"
            style={styles.signInButton}
            labelStyle={styles.buttonLabel}
            onPress={handleEmailSignIn}
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>
          
          <Text style={styles.orText}>OR</Text>
          
          <Button
            mode="outlined"
            style={styles.googleButton}
            icon={() => <MaterialCommunityIcons name="google" size={20} color={theme.colors.primary} />}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            Sign in with Google
          </Button>
          
          <Button
            mode="text"
            onPress={handleDemoLogin}
            style={styles.demoButton}
            disabled={isLoading}
          >
            Try Demo Account
          </Button>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-up')}>
              <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: theme.colors.primary,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.onBackground,
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.background,
  },
  signInButton: {
    padding: 4,
    marginBottom: 24,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 12,
    color: theme.colors.onSurfaceVariant,
  },
  googleButton: {
    marginBottom: 16,
  },
  demoButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
}); 