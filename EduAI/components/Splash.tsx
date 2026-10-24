import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width * 0.6, height * 0.3);

export default function Splash() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
}); 