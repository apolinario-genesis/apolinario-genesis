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
import ResponsiveContainer from './components/ui/ResponsiveContainer';
import Card from './components/ui/Card';
import Header from './components/ui/Header';
// import NotificationBell from './components/NotificationBell';
import NotificationService from './services/NotificationService';

export default function DashboardScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    initializeNotifications();
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

  const initializeNotifications = async () => {
    const notificationService = NotificationService.getInstance();
    await notificationService.initialize();
    
    // Send a welcome notification
    await notificationService.addNotification({
      title: '🌅 Bem-vindos!',
      message: 'Vocês estão conectados! Explorem juntos todas as funcionalidades do Nosso Diário.',
      type: 'reminder',
    });
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

  const navigateToFeature = (route: string) => {
    router.push(route);
  };

  const showNotifications = () => {
    Alert.alert(
      '🔔 Notificações',
      'Sistema de notificações ativo! Vocês receberão lembretes sobre eventos, mensagens e atividades.',
      [{ text: 'OK' }]
    );
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            <View style={styles.headerActions}>
              <NotificationBell onPress={showNotifications} />
              <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Message */}
          <Card style={styles.welcomeCard}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.heartIcon}>💕</Text>
              <Text style={styles.welcomeTitle}>Bem-vindos ao Nosso Diário!</Text>
            </View>
            <Text style={styles.welcomeText}>
              Vocês agora estão conectados como casal. Explorem juntos as funcionalidades 
              que irão fortalecer ainda mais o relacionamento de vocês em Cristo.
            </Text>
          </Card>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <Card 
              variant="feature"
              onPress={() => navigateToFeature('/(features)/love-wall')}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>💝</Text>
              </View>
              <Text style={styles.featureTitle}>Mural do Amor</Text>
              <Text style={styles.featureDescription}>
                Enviem mensagens, frases e declarações românticas
              </Text>
            </Card>

            <Card 
              variant="feature"
              onPress={() => navigateToFeature('/(features)/calendar')}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>📅</Text>
              </View>
              <Text style={styles.featureTitle}>Agenda do Casal</Text>
              <Text style={styles.featureDescription}>
                Registrem datas importantes e compromissos
              </Text>
            </Card>

            <Card 
              variant="feature"
              onPress={() => navigateToFeature('/(features)/diary')}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>📝</Text>
              </View>
              <Text style={styles.featureTitle}>Diário Compartilhado</Text>
              <Text style={styles.featureDescription}>
                Registrem momentos marcantes juntos
              </Text>
            </Card>

            <Card 
              variant="feature"
              onPress={() => navigateToFeature('/(features)/spiritual')}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>📖</Text>
              </View>
              <Text style={styles.featureTitle}>Espaço Espiritual</Text>
              <Text style={styles.featureDescription}>
                Orações, reflexões e estudos bíblicos
              </Text>
            </Card>

            <Card 
              variant="feature"
              onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! 🎯')}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>🎯</Text>
              </View>
              <Text style={styles.featureTitle}>Desafios</Text>
              <Text style={styles.featureDescription}>
                Desafios semanais para fortalecer o relacionamento
              </Text>
            </Card>

            <Card 
              variant="feature"
              onPress={() => Alert.alert('Em breve', 'Esta funcionalidade está sendo desenvolvida! ❤️')}
            >
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>❤️</Text>
              </View>
              <Text style={styles.featureTitle}>Emoções Diárias</Text>
              <Text style={styles.featureDescription}>
                Compartilhem como estão se sentindo
              </Text>
            </Card>
          </View>

          {/* Bible Verse */}
          <Card style={[styles.verseCard, { marginBottom: 50 }]}>
            <Text style={styles.verseText}>
              "Acima de tudo, revistam-se do amor, que é o elo perfeito."
            </Text>
            <Text style={styles.verseRef}>Colossenses 3:14</Text>
          </Card>
        </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    marginHorizontal: 32,
    marginBottom: 32,
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