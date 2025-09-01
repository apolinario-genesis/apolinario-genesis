import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveContainer from './components/ui/ResponsiveContainer';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CoupleSetupScreen() {
  const router = useRouter();
  const [coupleCode, setCoupleCode] = useState('');
  const [userCoupleCode, setUserCoupleCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
        setUserCoupleCode(user.couple_code || '');
        console.log('👤 Dados do usuário carregados:', user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const joinCouple = async () => {
    if (!coupleCode.trim()) {
      Alert.alert('Erro', 'Digite o código do casal');
      return;
    }

    console.log('👫 Tentando conectar com código:', coupleCode.toUpperCase());
    setIsLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      console.log('🔐 Token obtido:', token ? 'Token válido' : 'Token não encontrado');
      
      const response = await fetch(`${BACKEND_URL}/api/auth/join-couple`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couple_code: coupleCode.toUpperCase(),
        }),
      });

      console.log('📥 Resposta da conexão:', response.status, response.statusText);
      const result = await response.json();
      console.log('📋 Resultado da conexão:', result);

      if (response.ok) {
        Alert.alert(
          'Vocês estão conectados! 💕🎉', 
          `Sucesso! Agora vocês estão oficialmente conectados como casal.\n\nSeu parceiro(a): ${result.partner_name}\n\nVocês podem acessar todas as funcionalidades juntos!`,
          [
            {
              text: 'Começar Jornada',
              onPress: () => {
                // Update user data with partner info
                updateUserData(result.partner_name);
                console.log('🏠 Navegando para dashboard após conexão');
                router.replace('/dashboard');
              }
            }
          ]
        );
      } else {
        console.log('❌ Erro na conexão:', result);
        if (result.detail === 'Invalid couple code') {
          Alert.alert('Código Inválido', 'O código informado não existe. Verifique com seu parceiro(a) e tente novamente.');
        } else if (result.detail === 'You already have a partner') {
          Alert.alert('Já Conectado', 'Você já está conectado(a) com um parceiro(a).');
        } else if (result.detail === 'This person already has a partner') {
          Alert.alert('Parceiro Ocupado', 'Esta pessoa já está conectada com outro parceiro(a).');
        } else {
          Alert.alert('Erro', result.detail || 'Não foi possível conectar. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('💥 Erro na conexão do casal:', error);
      Alert.alert(
        'Erro de Conexão', 
        'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = async (partnerName: string) => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        user.partner_name = partnerName;
        await AsyncStorage.setItem('user_data', JSON.stringify(user));
        console.log('💾 Dados do usuário atualizados com parceiro');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Olá! Vamos nos conectar no Nosso Diário! 💕\n\nMeu código do casal é: ${userCoupleCode}\n\nBaixe o app e use este código para nos conectarmos como casal!`,
        title: 'Código do Casal - Nosso Diário',
      });
      console.log('📤 Código compartilhado');
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      console.log('🚪 Logout do setup');
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ResponsiveContainer>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Text style={styles.heartIcon}>💕</Text>
              </View>
              
              <Text style={styles.title}>Conectar com seu Parceiro(a)</Text>
              <Text style={styles.subtitle}>Olá, {userName}! 💕</Text>
            </View>

            {/* Your Code Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Seu Código do Casal</Text>
              <Text style={styles.sectionSubtitle}>
                Compartilhe este código com seu parceiro(a) para se conectarem
              </Text>
              
              <View style={styles.codeContainer}>
                <Text style={styles.code}>{userCoupleCode}</Text>
              </View>

              <TouchableOpacity style={styles.shareButton} onPress={shareCode}>
                <Text style={styles.shareButtonText}>📤 Compartilhar Código</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Join Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conectar com Código</Text>
              <Text style={styles.sectionSubtitle}>
                Digite o código que seu parceiro(a) compartilhou com você
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Código do Casal</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite o código (ex: ABC123)"
                  placeholderTextColor="#A66B7A"
                  value={coupleCode}
                  onChangeText={setCoupleCode}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity 
                style={[styles.joinButton, isLoading && styles.joinButtonDisabled]}
                onPress={joinCouple}
                disabled={isLoading}
              >
                <Text style={styles.joinButtonText}>
                  {isLoading ? '💕 Conectando...' : '👫 Conectar como Casal'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                💡 Após a conexão, vocês poderão usar todas as funcionalidades do Nosso Diário juntos!
              </Text>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>📋 Como funciona:</Text>
              <Text style={styles.instructionItem}>1. Compartilhe seu código com seu parceiro(a)</Text>
              <Text style={styles.instructionItem}>2. Ou peça o código dele(a) e digite acima</Text>
              <Text style={styles.instructionItem}>3. Após conectar, vocês acessarão o app juntos</Text>
              <Text style={styles.instructionItem}>4. Explorem: Mural do Amor, Agenda, Diário e mais!</Text>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: '#A66B7A',
    fontSize: 16,
    fontWeight: '500',
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#F4E6EA',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heartIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A66B7A',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D4A5B0',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4A5B0',
    letterSpacing: 3,
  },
  shareButton: {
    backgroundColor: '#B8E6D1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B8E6D1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  shareButtonText: {
    color: '#4A6A5A',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F4E6EA',
  },
  dividerText: {
    color: '#A66B7A',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4B6B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: '#8B4B6B',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 2,
    minHeight: 56,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  joinButton: {
    backgroundColor: '#D4A5B0',
    paddingVertical: 18,
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
  joinButtonDisabled: {
    backgroundColor: '#C4A5A5',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: '#F9F1F3',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  infoText: {
    color: '#8B4B6B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionItem: {
    fontSize: 14,
    color: '#8B4B6B',
    lineHeight: 22,
    marginBottom: 8,
  },
});