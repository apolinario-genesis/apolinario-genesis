import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
  backgroundColor?: string;
}

export default function FloatingActionButton({ 
  onPress, 
  icon = '+',
  backgroundColor = '#D4A5B0'
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.fabText}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});