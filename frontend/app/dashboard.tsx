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
      <StatusBar style="dark" />
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
          <View style={styles.welcomeHeader}>
            <Text style={styles.heartIcon}>💕</Text>
            <Text style={styles.welcomeTitle}>Bem-vindos ao Nosso Diário!</Text>
          </View>
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
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>💝</Text>
            </View>
            <Text style={styles.featureTitle}>Mural do Amor</Text>
            <Text style={styles.featureDescription}>
              Enviem mensagens, frases e declarações românticas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 📅')}
          >
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>📅</Text>
            </View>
            <Text style={styles.featureTitle}>Agenda do Casal</Text>
            <Text style={styles.featureDescription}>
              Registrem datas importantes e compromissos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 📝')}
          >
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>📝</Text>
            </View>
            <Text style={styles.featureTitle}>Diário Compartilhado</Text>
            <Text style={styles.featureDescription}>
              Registrem momentos marcantes juntos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 📖')}
          >
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>📖</Text>
            </View>
            <Text style={styles.featureTitle}>Espaço Espiritual</Text>
            <Text style={styles.featureDescription}>
              Planos de leitura bíblica e orações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 🎯')}
          >
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>🎯</Text>
            </View>
            <Text style={styles.featureTitle}>Desafios</Text>
            <Text style={styles.featureDescription}>
              Desafios semanais para fortalecer o relacionamento
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! ❤️')}
          >
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>❤️</Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B4B6B',
  },
  partnerText: {
    fontSize: 14,
    color: '#A66B7A',
    marginTop: 4,
    fontWeight: '500',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#A66B7A',
    fontSize: 16,
    fontWeight: '500',
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 32,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
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
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heartIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
  },
  welcomeText: {
    fontSize: 14,
    color: '#8B4B6B',
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresGrid: {
    paddingHorizontal: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
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
  featureIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F9F1F3',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#A66B7A',
    textAlign: 'center',
    lineHeight: 18,
  },
  verseCard: {
    backgroundColor: '#F9F1F3',
    marginHorizontal: 32,
    marginVertical: 32,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F4E6EA',
    marginBottom: 50,
  },
  verseText: {
    fontSize: 16,
    color: '#8B4B6B',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  verseRef: {
    fontSize: 14,
    color: '#D4A5B0',
    textAlign: 'center',
    fontWeight: '700',
  },
});