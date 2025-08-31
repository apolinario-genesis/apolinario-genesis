import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({ 
  title, 
  subtitle, 
  showBackButton = false, 
  rightAction 
}: HeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {showBackButton && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {rightAction && (
        <View style={styles.rightAction}>
          {rightAction}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    position: 'relative',
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#D4A5B0',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
  },
  rightAction: {
    position: 'absolute',
    right: 32,
    top: 20,
  },
});