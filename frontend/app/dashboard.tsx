import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('user_data');
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['auth_token', 'user_data']);
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
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
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {userData?.name}! 💕</Text>
            {userData?.partner_name && (
              <Text style={styles.partnerText}>
                Conectado(a) com {userData.partner_name}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bem-vindos ao Sacred Bond! 🙏</Text>
          <Text style={styles.welcomeText}>
            Vocês agora estão conectados como casal. Explorem juntos as funcionalidades 
            que irão fortalecer ainda mais o relacionamento de vocês em Cristo.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 💕')}
          >
            <Text style={styles.featureIcon}>💕</Text>
            <Text style={styles.featureTitle}>Mural do Amor</Text>
            <Text style={styles.featureDescription}>
              Enviem mensagens, frases e declarações românticas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 📅')}
          >
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={styles.featureTitle}>Agenda do Casal</Text>
            <Text style={styles.featureDescription}>
              Registrem datas importantes e compromissos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 📓')}
          >
            <Text style={styles.featureIcon}>📓</Text>
            <Text style={styles.featureTitle}>Diário Compartilhado</Text>
            <Text style={styles.featureDescription}>
              Registrem momentos marcantes juntos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 📖')}
          >
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureTitle}>Espaço Espiritual</Text>
            <Text style={styles.featureDescription}>
              Planos de leitura bíblica e orações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 🎯')}
          >
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureTitle}>Desafios</Text>
            <Text style={styles.featureDescription}>
              Desafios semanais para fortalecer o relacionamento
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! ❤️')}
          >
            <Text style={styles.featureIcon}>❤️</Text>
            <Text style={styles.featureTitle}>Emoções Diárias</Text>
            <Text style={styles.featureDescription}>
              Compartilhem como estão se sentindo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bible Verse */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>
            "Acima de tudo, revistam-se do amor, que é o elo perfeito."
          </Text>
          <Text style={styles.verseRef}>Colossenses 3:14</Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b9d',
  },
  partnerText: {
    fontSize: 14,
    color: '#a5b4fc',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#6b7280',
    fontSize: 16,
  },
  welcomeCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b9d',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#c7d2fe',
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresGrid: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#16213e',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e3a8a',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0e7ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#a5b4fc',
    textAlign: 'center',
    lineHeight: 18,
  },
  verseCard: {
    backgroundColor: '#16213e',
    marginHorizontal: 24,
    marginVertical: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff6b9d',
    marginBottom: 40,
  },
  verseText: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  verseRef: {
    fontSize: 14,
    color: '#ff6b9d',
    textAlign: 'center',
    fontWeight: '600',
  },
});