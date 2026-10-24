import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export default function SignUpScreen() {
  const { signUp, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    try {
      setError(null);
      setSuccess(null);
      setIsSubmitting(true);
      
      // Validate inputs
      if (!email) {
        setError('Please enter your email');
        setIsSubmitting(false);
        return;
      }
      
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }
      
      if (!password) {
        setError('Please enter a password');
        setIsSubmitting(false);
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Signing up with:', email);
      const result = await signUp(email, password);
      
      if (result.error) {
        console.error('Sign up error:', result.error);
        setError(result.error.message || 'Failed to sign up. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Sign up successful!');
      setSuccess('Sign up successful! Please check your email to confirm your account.');
      
      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect after a short delay to allow user to see success message
      setTimeout(() => {
        router.replace('/sign-in');
      }, 3000);
      
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
          
          <Text style={styles.welcomeText}>Create Account</Text>
          <Text style={styles.subText}>Sign up to get started</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          {success && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{success}</Text>
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
              disabled={isLoading || isSubmitting}
              left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
            />
            
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword}
              disabled={isLoading || isSubmitting}
              left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  color={theme.colors.primary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              mode="outlined"
              secureTextEntry={!showPassword}
              disabled={isLoading || isSubmitting}
              left={<TextInput.Icon icon="lock-check" color={theme.colors.primary} />}
              error={confirmPassword.length > 0 && password !== confirmPassword}
            />
          </View>
          
          <Button
            mode="contained"
            style={styles.signUpButton}
            labelStyle={styles.buttonLabel}
            onPress={handleSignUp}
            loading={isLoading || isSubmitting}
            disabled={isLoading || isSubmitting}
          >
            Sign Up
          </Button>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/sign-in')}>
              <Text style={styles.signInText}>Sign In</Text>
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
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    color: '#2E7D32',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.background,
  },
  signUpButton: {
    padding: 4,
    marginBottom: 24,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: theme.colors.onSurfaceVariant,
  },
  signInText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
}); 