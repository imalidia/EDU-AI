import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Surface } from 'react-native-paper';
import { colors } from '../../constants/theme';

type CardProps = ViewProps & {
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  variant?: 'primary' | 'secondary';
};

export const Card = ({ 
  style, 
  elevation = 1,
  variant = 'primary',
  children,
  ...props 
}: CardProps) => {
  return (
    <Surface
      style={[
        styles.card,
        variant === 'primary' && styles.primaryCard,
        variant === 'secondary' && styles.secondaryCard,
        style,
      ]}
      elevation={elevation}
      {...props}
    >
      {children}
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryCard: {
    backgroundColor: colors.card,
  },
  secondaryCard: {
    backgroundColor: colors.background,
  },
}); 