import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Root component that redirects to the app home page
 * This is kept extremely minimal to avoid render issues
 */
export default function Index() {
  return <Redirect href="/(app)" />;
} 