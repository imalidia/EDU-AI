import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { colors } from '../../constants/theme';

type ButtonProps = React.ComponentProps<typeof PaperButton> & {
  variant?: 'primary' | 'secondary' | 'outline';
};

export const Button = ({ 
  variant = 'primary',
  mode,
  style,
  labelStyle,
  ...props 
}: ButtonProps) => {
  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.primaryButton,
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    style,
  ];

  const textStyle = [
    styles.text,
    variant === 'outline' && styles.outlineText,
    labelStyle,
  ];

  return (
    <PaperButton
      mode={variant === 'outline' ? 'outlined' : 'contained'}
      style={buttonStyle}
      labelStyle={textStyle}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.text,
  },
  outlineText: {
    color: colors.primary,
  },
}); 