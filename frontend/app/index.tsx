import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveContainer from './components/ui/ResponsiveContainer';
import Card from './components/ui/Card';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AuthScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        console.log('🔍 Verificando token existente...');
        // Verify token is still valid
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const user = await response.json();
          console.log('✅ Token válido, redirecionando usuário logado');
          if (user.partner_id) {
            router.replace('/dashboard');
          } else {
            router.replace('/couple-setup');
          }
          return;
        } else {
          console.log('❌ Token inválido, limpando dados');
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
        <ResponsiveContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando...</Text>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ResponsiveContainer>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            {/* Clean Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.heartIcon}>💕</Text>
              </View>
              <Text style={styles.title}>NOSSO DIÁRIO</Text>
              <Text style={styles.subtitle}>Aplicativo para Casais Cristãos</Text>
            </View>

            {/* Auth Section */}
            <View style={styles.authSection}>
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>
                  {showRegister ? 'CRIAR CONTA' : 'FAZER LOGIN'}
                </Text>
                <Text style={styles.authSubtitle}>
                  {showRegister 
                    ? 'Comece sua jornada em casal' 
                    : 'Entre para continuar sua jornada'
                  }
                </Text>

                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.primaryButton]}
                    onPress={() => {
                      console.log('🔐 Navegando para:', showRegister ? 'register' : 'login');
                      router.push(showRegister ? '/auth/register' : '/auth/login');
                    }}
                  >
                    <Text style={styles.primaryButtonText}>
                      {showRegister ? 'CADASTRAR' : 'ENTRAR'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => setShowRegister(!showRegister)}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {showRegister ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastrar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* App Features Preview */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>FUNCIONALIDADES DO APP</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>💝</Text>
                  <Text style={styles.featureText}>Mural do Amor</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📅</Text>
                  <Text style={styles.featureText}>Agenda do Casal</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📝</Text>
                  <Text style={styles.featureText}>Diário Compartilhado</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📖</Text>
                  <Text style={styles.featureText}>Espaço Espiritual</Text>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B4B6B',
    fontSize: 18,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F4E6EA',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  heartIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A66B7A',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  verse: {
    fontSize: 15,
    color: '#8B4B6B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  verseRef: {
    fontSize: 13,
    color: '#A66B7A',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B4B6B',
    textAlign: 'center',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#A66B7A',
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  buttonsContainer: {
    paddingBottom: 50,
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    backgroundColor: '#D4A5B0',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4A5B0',
  },
  secondaryButtonText: {
    color: '#D4A5B0',
    fontSize: 18,
    fontWeight: '600',
  },
  benefitsContainer: {
    backgroundColor: '#F9F1F3',
    padding: 20,
    borderRadius: 16,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    fontSize: 14,
    color: '#8B4B6B',
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 8,
  },
});