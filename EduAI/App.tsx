import React, { useEffect } from 'react';
import './app/services/environmentSetup'; // Initialize environment early

// Import the expo-router app entry point
import { ExpoRoot } from 'expo-router';

export default function App() {
  useEffect(() => {
    console.log('App initialized with environment setup');
  }, []);

  // ExpoRoot is the default entry point for Expo Router
  // It will automatically find the app entry point
  return <ExpoRoot context={require.context('./app')} />;
} 