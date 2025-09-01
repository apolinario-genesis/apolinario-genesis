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
    paddingHorizontal: 24,
  },
  // Clean Header Section
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#F4E6EA',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  heartIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B4B6B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Auth Section
  authSection: {
    marginBottom: 32,
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#8B4B6B',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  primaryButton: {
    backgroundColor: '#D4A5B0',
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  secondaryButtonText: {
    color: '#D4A5B0',
    fontSize: 14,
    fontWeight: '600',
  },
  // Features Section
  featuresSection: {
    flex: 1,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B4B6B',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  featureItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4B6B',
    textAlign: 'center',
    lineHeight: 16,
  },
});