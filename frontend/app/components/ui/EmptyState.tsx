import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  style?: any;
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  style 
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyState, style]}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
    lineHeight: 22,
  },
});