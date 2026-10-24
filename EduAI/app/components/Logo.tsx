import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../theme';

// Import SVG logos
import ColorLogo from '../../assets/images/logo-color.svg';
import WhiteLogo from '../../assets/images/logo-white.svg';

type LogoVariant = 'color' | 'white' | 'text' | 'full';
type LogoSize = 'small' | 'medium' | 'large';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  textColor?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  variant = 'color', 
  size = 'medium',
  textColor = theme.colors.primary 
}) => {
  // Define sizes for different size options
  const sizes = {
    small: 40,
    medium: 60,
    large: 80
  };
  
  const logoSize = sizes[size];
  const fontSize = size === 'small' ? 18 : size === 'medium' ? 24 : 32;
  
  // Text-only logo
  if (variant === 'text') {
    return (
      <Text style={[styles.logoText, { fontSize, color: textColor }]}>
        Edu AI
      </Text>
    );
  }
  
  // Image logo only
  if (variant === 'color' || variant === 'white') {
    return (
      <Image
        source={require('../../assets/images/icon.png')}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
      />
    );
  }
  
  // Full logo (image + text)
  return (
    <View style={styles.fullLogo}>
      {variant === 'full' && (
        <>
          <Image
            source={require('../../assets/images/icon.png')}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="contain"
          />
          <Text style={[
            styles.logoText, 
            { fontSize, color: textColor, marginTop: 8 }
          ]}>
            Edu AI
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullLogo: {
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    fontFamily: 'System',
  }
});

export default Logo; 