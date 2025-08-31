import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  variant?: 'default' | 'feature' | 'content';
}

export default function Card({ 
  children, 
  onPress, 
  style, 
  variant = 'default' 
}: CardProps) {
  const Component = onPress ? TouchableOpacity : View;
  
  return (
    <Component 
      style={[
        styles.card,
        styles[variant],
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  default: {
    marginBottom: 16,
  },
  feature: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  content: {
    marginBottom: 20,
  },
});