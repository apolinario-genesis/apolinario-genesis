import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function WelcomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        // Verify token is still valid
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const user = await response.json();
          if (user.partner_id) {
            router.replace('/dashboard');
          } else {
            router.replace('/couple-setup');
          }
          return;
        } else {
          // Token is invalid, clear storage
          await AsyncStorage.multiRemove(['auth_token', 'user_data']);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Sacred Bond</Text>
            <Text style={styles.subtitle}>Aplicativo para Casais Cristãos</Text>
            <Text style={styles.verse}>
              "Portanto, deixará o homem pai e mãe e se unirá à sua mulher, 
              e serão dois uma só carne."
            </Text>
            <Text style={styles.verseRef}>Efésios 5:31</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>💕</Text>
              <Text style={styles.featureText}>Mural do Amor</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📅</Text>
              <Text style={styles.featureText}>Agenda do Casal</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📖</Text>
              <Text style={styles.featureText}>Espaço Espiritual</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📓</Text>
              <Text style={styles.featureText}>Diário Compartilhado</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.primaryButtonText}>Fazer Login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.secondaryButtonText}>Criar Conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ff6b9d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#c7d2fe',
    marginBottom: 32,
    textAlign: 'center',
  },
  verse: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  verseRef: {
    fontSize: 14,
    color: '#a5b4fc',
    textAlign: 'center',
    marginBottom: 40,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  feature: {
    width: '48%',
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    color: '#c7d2fe',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonsContainer: {
    paddingBottom: 40,
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButton: {
    backgroundColor: '#ff6b9d',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b9d',
  },
  secondaryButtonText: {
    color: '#ff6b9d',
    fontSize: 18,
    fontWeight: '600',
  },
});