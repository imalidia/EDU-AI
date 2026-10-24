import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Text, Surface, Switch, Button, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useStreak } from '../contexts/StreakContext';
import { useSettings, AIProvider, StorageMode } from '../contexts/SettingsContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import supabase from './services/supabaseClient';

export default function ProfileScreen() {
  const { user, signOut, bypassLogin, updateProfile } = useAuth();
  const { currentStreak, longestStreak, totalDays, refreshStreakData } = useStreak();
  const { settings, switchStorageMode, saveSupabaseConfig, saveAIConfig, generateAnswer } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // AI & Storage configuration state
  const [aiProvider, setAiProvider] = useState<AIProvider>(settings.aiProvider);
  const [aiApiKey, setAiApiKey] = useState(settings.aiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabaseUrl);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(settings.supabaseAnonKey);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);
  const [testingAi, setTestingAi] = useState(false);

  useEffect(() => {
    setAiProvider(settings.aiProvider);
    setAiApiKey(settings.aiApiKey);
    setSupabaseUrlInput(settings.supabaseUrl);
    setSupabaseKeyInput(settings.supabaseAnonKey);
  }, [settings]);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      if (settings.storageMode === 'local') {
        bypassLogin();
        return;
      }
      // Redirect to auth if no user is found
      console.log("No user found, redirecting to auth");
      router.replace('/auth');
      return;
    }
    
    // Initialize profile data
    setFirstName(user.user_metadata?.first_name || '');
    setLastName(user.user_metadata?.last_name || '');
    
    const avatarUrl = user.user_metadata?.avatar_url || null;
    // Only use the URL if it's valid
    if (avatarUrl && (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http'))) {
      setProfileImage(avatarUrl);
    } else {
      setProfileImage(null);
    }
    
    setIsInitialized(true);
  }, [user, settings.storageMode]);

  useEffect(() => {
    if (user) {
      // Refresh streak data when profile page loads
      refreshStreakData();
    }
  }, [user]);

  useEffect(() => {
    if (!isEditing) {
      setUpdateError(null);
    }
  }, [isEditing]);

  const handleSaveAiKey = async () => {
    await saveAIConfig(aiProvider, aiApiKey);
    setConfigFeedback(`Saved ${aiProvider.toUpperCase()} API Key!`);
    setTimeout(() => setConfigFeedback(null), 3500);
  };

  const handleTestAiKey = async () => {
    await saveAIConfig(aiProvider, aiApiKey);
    setTestingAi(true);
    setConfigFeedback(null);
    try {
      const reply = await generateAnswer('Reply with a 1-sentence greeting confirming the EduAI API key works.');
      setConfigFeedback(`AI Connected: "${reply}"`);
    } catch (err: any) {
      setConfigFeedback(`Error: ${err?.message || 'Could not connect with API key'}`);
    } finally {
      setTestingAi(false);
    }
  };

  const handleStorageModeChange = async (value: string) => {
    const mode = value as StorageMode;
    await switchStorageMode(mode);
    if (mode === 'local' && !user) {
      await bypassLogin();
    }
    setConfigFeedback(
      mode === 'local'
        ? 'Switched to Local Storage mode (all data saved on device).'
        : 'Switched to Supabase Cloud mode.'
    );
    setTimeout(() => setConfigFeedback(null), 3500);
  };

  const handleSaveSupabase = async () => {
    if (!supabaseUrlInput.trim().startsWith('http')) {
      setConfigFeedback('Error: Supabase URL must start with https://');
      return;
    }
    await saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput, true);
    setConfigFeedback('Supabase URL & Anon Key saved and connected!');
    setTimeout(() => setConfigFeedback(null), 3500);
  };

  const pickImage = async () => {
    try {
      // Show instruction dialog first
      Alert.alert(
        "Choose Profile Photo",
        "Your photo will be cropped to a square. Position it carefully in the cropping area.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Choose Photo", 
            onPress: async () => {
              // Request permissions
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              
              if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile photo');
                return;
              }

              // Launch image picker with forced cropping and reduced quality
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                exif: false, // Don't include EXIF data to reduce size
                base64: false, // We won't use base64 directly from the picker
              });

              if (!result.canceled) {
                const selectedImage = result.assets[0];
                // Set the URI directly
                setProfileImage(selectedImage.uri);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      // For local images (file:// protocol), resize and compress
      if (uri.startsWith('file://')) {
        console.log('Processing local image...');
        
        // Resize and compress the image
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 300, height: 300 } }], // Resize to 300x300
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // Compress to 60%
        );
        
        console.log('Image resized from', uri, 'to', manipResult.uri);
        
        // Convert to small base64 string
        const response = await fetch(manipResult.uri);
        const imageBlob = await response.blob();
        console.log('Image blob size:', imageBlob.size, 'bytes');
        
        // If the image is still too large, reduce further
        if (imageBlob.size > 50000) { // If more than ~50KB, compress more
          console.log('Image still too large, compressing further...');
          const smallerImage = await ImageManipulator.manipulateAsync(
            manipResult.uri,
            [{ resize: { width: 150, height: 150 } }], // Smaller resize
            { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG } // More compression
          );
          
          const smallerResponse = await fetch(smallerImage.uri);
          const smallerBlob = await smallerResponse.blob();
          console.log('Smaller image blob size:', smallerBlob.size, 'bytes');
          
          // If still too large, just return empty
          if (smallerBlob.size > 100000) {
            console.warn('Image still too large after maximum compression');
            throw new Error('Image too large. Please choose a smaller image.');
          }
          
          return smallerImage.uri;
        }
        
        return manipResult.uri;
      }
      
      // If the URI is already a data URL or remote URL, just return it
      return uri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setUpdateError(null);
    
    try {
      // Check if user is still authenticated
      if (!user) {
        console.error('User not authenticated during profile update');
        setUpdateError('You are not logged in. Please sign in again.');
        setIsLoading(false);
        return;
      }

      // First process the image if needed
      let processedImage: string | undefined = undefined;
      
      if (profileImage) {
        try {
          // Process the image if it's a file URI
          if (profileImage.startsWith('file://')) {
            processedImage = await uploadImage(profileImage);
            console.log('Image processed successfully');
          } else {
            // Use existing URL (e.g. http:// or data:)
            processedImage = profileImage;
          }
        } catch (imgError: any) {
          console.error('Error processing image:', imgError);
          setUpdateError('Failed to process profile image. Please try a smaller image.');
          setIsLoading(false);
          return;
        }
      }

      // Create update data object with proper types
      const updateData: {
        first_name: string;
        last_name: string;
        avatar_url?: string;
      } = {
        first_name: firstName,
        last_name: lastName,
      };

      // Only include avatar_url if we have a processed image
      if (processedImage) {
        updateData.avatar_url = processedImage;
      }

      console.log('Updating profile with:', updateData);

      // Update profile
      const result = await updateProfile(updateData);

      if (result.error) {
        console.error('Profile update error:', result.error);
        
        // Check for partial success (profile updated but avatar failed)
        if (result.error.message && result.error.message.includes('Profile info updated')) {
          // This is a partial success case
          setUpdateError(result.error.message);
          // Still set editing to false since basic info was updated
          setIsEditing(false);
          
          // Refresh user data after short delay
          setTimeout(() => {
            if (user) {
              setFirstName(user.user_metadata?.first_name || '');
              setLastName(user.user_metadata?.last_name || '');
              setUpdateError(null);
            }
          }, 3000);
        } else if (result.error.message && result.error.message.includes('too large')) {
          setUpdateError('The image is too large. Please choose a smaller image or let us crop it further.');
        } else if (result.error.message.includes('No user logged in')) {
          setUpdateError('Session expired. Please sign in again.');
          setTimeout(() => {
            signOut().then(() => router.replace('/auth'));
          }, 2000);
        } else {
          setUpdateError(result.error.message || 'Failed to update profile');
        }
      } else {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setUpdateError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          onPress={() => router.back()}
          textColor="#94A3B8"
        >
          Back
        </Button>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {!user || !isInitialized ? (
        <Surface style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </Surface>
      ) : (
        <>
          {updateError && (
            <Surface style={styles.errorCard}>
              <Text style={styles.errorText}>{updateError}</Text>
              <Text style={styles.errorHelpText}>
                Please try again or contact support if the issue persists.
              </Text>
            </Surface>
          )}

          <Surface style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatarWrapper}
                onPress={isEditing ? pickImage : undefined}
                disabled={!isEditing}
              >
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                    onError={(e) => {
                      console.error('Image loading error:', e.nativeEvent.error);
                      setProfileImage(null);
                    }}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {firstName ? firstName[0] : ''}{lastName ? lastName[0] : ''}
                    </Text>
                  </View>
                )}
                {isEditing && (
                  <View style={styles.editIconContainer}>
                    <Text style={styles.editIcon}>+</Text>
                  </View>
                )}
              </TouchableOpacity>

              {isEditing && (
                <Text style={styles.tapHintText}>
                  Tap to change photo
                </Text>
              )}

              {!isEditing ? (
                <>
                  <Text style={styles.name}>
                    {firstName && lastName ? `${firstName} ${lastName}` : 'Add your name'}
                  </Text>
                  <Text style={styles.email}>{user?.email}</Text>
                  <Button 
                    mode="text" 
                    onPress={() => setIsEditing(true)}
                    textColor="#10B981"
                  >
                    Edit Profile
                  </Button>
                </>
              ) : (
                <>
                  <TextInput
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    mode="outlined"
                    outlineColor="#2D3B54"
                    activeOutlineColor="#10B981"
                    textColor="#FFFFFF"
                  />
                  <TextInput
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    mode="outlined"
                    outlineColor="#2D3B54"
                    activeOutlineColor="#10B981"
                    textColor="#FFFFFF"
                  />
                  <Button 
                    mode="contained" 
                    onPress={handleUpdateProfile}
                    style={styles.saveButton}
                    buttonColor="#10B981"
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    mode="text" 
                    onPress={() => {
                      setIsEditing(false);
                      setProfileImage(user?.user_metadata?.avatar_url || null);
                      setFirstName(user?.user_metadata?.first_name || '');
                      setLastName(user?.user_metadata?.last_name || '');
                    }}
                    textColor="#94A3B8"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </View>
          </Surface>

          <Surface style={styles.streakCard}>
            <View style={styles.streakContent}>
              <Text style={styles.streakTitle}>Daily Streak</Text>
              <Text style={styles.streakCount}>{currentStreak} days</Text>
              <Text style={styles.streakSubtitle}>
                {currentStreak > 0 
                  ? `Longest streak: ${longestStreak} days • Total active days: ${totalDays}`
                  : 'Start your streak today!'
                }
              </Text>
            </View>
          </Surface>

          {configFeedback && (
            <Surface
              style={[
                styles.feedbackCard,
                configFeedback.startsWith('Error') && styles.errorCard,
              ]}
            >
              <Text style={styles.feedbackText}>{configFeedback}</Text>
            </Surface>
          )}

          {/* AI API Key Card */}
          <Surface style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>AI API Key (Generate Answers)</Text>
            <Text style={styles.helperSubtext}>
              Connect your API key to generate AI answers, study notes, and flashcards.
            </Text>

            <View style={styles.providerRow}>
              {(['openai', 'deepseek', 'gemini'] as AIProvider[]).map((prov) => (
                <Chip
                  key={prov}
                  selected={aiProvider === prov}
                  onPress={() => setAiProvider(prov)}
                  style={[
                    styles.providerChip,
                    aiProvider === prov && styles.providerChipActive,
                  ]}
                  textStyle={styles.providerChipText}
                >
                  {prov === 'openai' ? 'OpenAI' : prov === 'deepseek' ? 'DeepSeek' : 'Gemini'}
                </Chip>
              ))}
            </View>

            <TextInput
              label={`${aiProvider.toUpperCase()} API Key`}
              placeholder={aiProvider === 'gemini' ? 'AIza...' : 'sk-...'}
              value={aiApiKey}
              onChangeText={setAiApiKey}
              secureTextEntry={!showApiKey}
              style={styles.input}
              mode="outlined"
              outlineColor="#2D3B54"
              activeOutlineColor="#10B981"
              textColor="#FFFFFF"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              right={
                <TextInput.Icon
                  icon={showApiKey ? 'eye-off' : 'eye'}
                  color="#94A3B8"
                  onPress={() => setShowApiKey(!showApiKey)}
                />
              }
            />

            <View style={styles.actionRow}>
              <Button
                mode="contained"
                buttonColor="#10B981"
                onPress={handleSaveAiKey}
                style={styles.flexBtn}
              >
                Save API Key
              </Button>
              <Button
                mode="outlined"
                textColor="#10B981"
                onPress={handleTestAiKey}
                loading={testingAi}
                disabled={testingAi || !aiApiKey.trim()}
                style={styles.flexBtn}
              >
                Test Key
              </Button>
            </View>
          </Surface>

          {/* Storage Mode: Local Storage vs Supabase */}
          <Surface style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Data Storage (Local vs Supabase)</Text>
            <Text style={styles.helperSubtext}>
              Switch between offline Local Storage or connect your own Supabase project.
            </Text>

            <SegmentedButtons
              value={settings.storageMode}
              onValueChange={handleStorageModeChange}
              buttons={[
                { value: 'local', label: 'Local Storage' },
                { value: 'supabase', label: 'Supabase Cloud' },
              ]}
              style={styles.segmentedStorage}
            />

            {settings.storageMode === 'local' ? (
              <View style={styles.localBadgeBox}>
                <Text style={styles.localBadgeText}>
                  ✓ Local Storage Active — All notes, flashcards, decks, and streaks are stored directly on your device.
                </Text>
              </View>
            ) : (
              <View style={styles.supabaseForm}>
                <TextInput
                  label="Supabase Project URL"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrlInput}
                  onChangeText={setSupabaseUrlInput}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#2D3B54"
                  activeOutlineColor="#10B981"
                  textColor="#FFFFFF"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />
                <TextInput
                  label="Supabase Anon Public Key"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supabaseKeyInput}
                  onChangeText={setSupabaseKeyInput}
                  secureTextEntry={!showSupabaseKey}
                  style={styles.input}
                  mode="outlined"
                  outlineColor="#2D3B54"
                  activeOutlineColor="#10B981"
                  textColor="#FFFFFF"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  right={
                    <TextInput.Icon
                      icon={showSupabaseKey ? 'eye-off' : 'eye'}
                      color="#94A3B8"
                      onPress={() => setShowSupabaseKey(!showSupabaseKey)}
                    />
                  }
                />
                <Button
                  mode="contained"
                  buttonColor="#2563EB"
                  onPress={handleSaveSupabase}
                  icon="cloud-check"
                >
                  Save & Connect Supabase
                </Button>
              </View>
            )}
          </Surface>

          <Surface style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                color="#10B981"
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color="#10B981"
              />
            </View>
          </Surface>

          <Button
            mode="outlined"
            onPress={handleSignOut}
            style={styles.signOutButton}
            textColor="#EF4444"
            icon="logout"
          >
            Sign Out
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3B54',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
  },
  errorHelpText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#141B2E',
  },
  editIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#0A0F1C',
  },
  saveButton: {
    padding: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  streakCard: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3B54',
  },
  streakContent: {
    alignItems: 'flex-start',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 8,
  },
  streakSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  settingsCard: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D3B54',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  signOutButton: {
    margin: 16,
    borderColor: '#EF4444',
    borderWidth: 1,
  },
  loadingCard: {
    backgroundColor: '#141B2E',
    borderRadius: 16,
    margin: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    borderWidth: 1,
    borderColor: '#2D3B54',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
  tapHintText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  linkText: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  feedbackCard: {
    backgroundColor: '#141B2E',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10B981',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackText: {
    color: '#E2E8F0',
    fontSize: 13,
    flex: 1,
  },
  helperSubtext: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  providerChip: {
    backgroundColor: '#0A0F1C',
    borderColor: '#2D3B54',
    borderWidth: 1,
  },
  providerChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  providerChipText: {
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  flexBtn: {
    flex: 1,
  },
  segmentedStorage: {
    marginBottom: 16,
  },
  localBadgeBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  localBadgeText: {
    color: '#10B981',
    fontSize: 13,
    lineHeight: 18,
  },
  supabaseForm: {
    marginTop: 4,
  },
}); 