import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';

export default function YouTubeLibrary() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>YouTube Library</Text>
      <Text style={styles.message}>
        View your saved notes in the main Library.
      </Text>
      <Button 
        mode="contained" 
        onPress={() => router.replace('/library')}
        style={styles.button}
      >
        Go to Library
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A202C',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFFFFF',
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#CBD5E0',
    lineHeight: 24,
  },
  button: {
    marginTop: 20,
  }
});