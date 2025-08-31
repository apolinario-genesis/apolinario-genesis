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

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
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

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Sucesso!', `Vocês agora estão conectados como casal! 💕\nSeu parceiro(a): ${result.partner_name}`);
        
        // Update user data
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          const user = JSON.parse(userData);
          user.partner_name = result.partner_name;
          await AsyncStorage.setItem('user_data', JSON.stringify(user));
        }
        
        router.replace('/dashboard');
      } else {
        Alert.alert('Erro', result.detail || 'Código inválido');
      }
    } catch (error) {
      console.error('Join couple error:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareCode = async () => {
    try {
      await Share.share({
        message: `Olá! Vamos nos conectar no Sacred Bond! 💕\n\nMeu código do casal é: ${userCoupleCode}\n\nBaixe o app e use este código para nos conectarmos como casal!`,
        title: 'Código do Casal - Sacred Bond',
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
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
              <Text style={styles.shareButtonText}>Compartilhar Código</Text>
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
                placeholderTextColor="#6b7280"
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
                {isLoading ? 'Conectando...' : 'Conectar como Casal'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Após a conexão, vocês poderão usar todas as funcionalidades do Sacred Bond juntos!
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  logoutText: {
    color: '#6b7280',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff6b9d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#c7d2fe',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0e7ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#a5b4fc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: '#16213e',
    borderWidth: 2,
    borderColor: '#ff6b9d',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b9d',
    letterSpacing: 4,
  },
  shareButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  dividerText: {
    color: '#6b7280',
    fontSize: 14,
    marginHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0e7ff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16213e',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
    minHeight: 56,
  },
  joinButton: {
    backgroundColor: '#ff6b9d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  joinButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#16213e',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 40,
  },
  infoText: {
    color: '#a5b4fc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});