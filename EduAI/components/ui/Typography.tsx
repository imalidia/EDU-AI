import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, TextProps } from 'react-native-paper';
import { colors } from '../../constants/theme';

type TypographyVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption';
type TypographyColor = 'primary' | 'secondary' | 'accent';

interface TypographyProps extends Omit<TextProps<any>, 'variant'> {
  variant?: TypographyVariant;
  color?: TypographyColor;
}

export const Typography = ({
  variant = 'body',
  color = 'primary',
  style,
  ...props
}: TypographyProps) => {
  const textStyle = [
    styles.text,
    styles[variant],
    styles[`${color}Color`],
    style,
  ];

  return <Text style={textStyle} {...props} />;
};

const styles = StyleSheet.create({
  text: {
    color: colors.text,
  },
  h1: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  primaryColor: {
    color: colors.text,
  },
  secondaryColor: {
    color: colors.textSecondary,
  },
  accentColor: {
    color: colors.primary,
  },
}); 