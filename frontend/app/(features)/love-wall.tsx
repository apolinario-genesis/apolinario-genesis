import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface LoveMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  message: string;
  message_type: string;
  created_at: string;
}

export default function LoveWallScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<LoveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('message');
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    loadUserData();
    loadMessages();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/love-messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar mensagens');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert('Erro', 'Digite uma mensagem');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/love-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          message_type: messageType,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        setShowModal(false);
        loadMessages(); // Reload messages
        Alert.alert('Sucesso', 'Mensagem enviada com amor! 💕');
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Erro de conexão');
    }
  };

  const getMessageIcon = (type: string, isSent: boolean) => {
    const icons = {
      message: isSent ? '💕' : '💖',
      quote: isSent ? '📝' : '💌',
      declaration: isSent ? '💝' : '❤️',
    };
    return icons[type] || '💕';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando mensagens de amor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>💝 Mural do Amor</Text>
          <Text style={styles.subtitle}>Mensagens românticas entre vocês</Text>
        </View>
      </View>

      {/* Messages List */}
      <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💕</Text>
            <Text style={styles.emptyTitle}>Ainda não há mensagens</Text>
            <Text style={styles.emptyText}>
              Que tal começar enviando uma mensagem de amor para seu parceiro(a)?
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isSent = message.sender_id === currentUserId;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageCard,
                  isSent ? styles.sentMessage : styles.receivedMessage,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageIcon}>
                    {getMessageIcon(message.message_type, isSent)}
                  </Text>
                  <Text style={styles.senderName}>
                    {isSent ? 'Você' : message.sender_name}
                  </Text>
                  <Text style={styles.messageDate}>
                    {formatDate(message.created_at)}
                  </Text>
                </View>
                <Text style={styles.messageText}>{message.message}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Message Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nova Mensagem</Text>
            <TouchableOpacity onPress={sendMessage}>
              <Text style={styles.modalSendText}>Enviar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Message Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  messageType === 'message' && styles.typeButtonActive,
                ]}
                onPress={() => setMessageType('message')}
              >
                <Text style={styles.typeIcon}>💕</Text>
                <Text style={styles.typeText}>Mensagem</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  messageType === 'quote' && styles.typeButtonActive,
                ]}
                onPress={() => setMessageType('quote')}
              >
                <Text style={styles.typeIcon}>💌</Text>
                <Text style={styles.typeText}>Frase</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  messageType === 'declaration' && styles.typeButtonActive,
                ]}
                onPress={() => setMessageType('declaration')}
              >
                <Text style={styles.typeIcon}>❤️</Text>
                <Text style={styles.typeText}>Declaração</Text>
              </TouchableOpacity>
            </View>

            {/* Message Input */}
            <TextInput
              style={styles.messageInput}
              placeholder="Digite sua mensagem de amor..."
              placeholderTextColor="#A66B7A"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
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
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 32,
    paddingVertical: 20,
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
  },
  subtitle: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 32,
  },
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
  },
  emptyText: {
    fontSize: 14,
    color: '#A66B7A',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
  },
  sentMessage: {
    borderColor: '#F4E6EA',
    marginLeft: 40,
  },
  receivedMessage: {
    borderColor: '#E8F5E8',
    marginRight: 40,
    backgroundColor: '#F9F7F9',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4B6B',
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    color: '#A66B7A',
  },
  messageText: {
    fontSize: 15,
    color: '#8B4B6B',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#D4A5B0',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FDFBFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F4E6EA',
  },
  modalCancelText: {
    color: '#A66B7A',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
  },
  modalSendText: {
    color: '#D4A5B0',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
  },
  typeButtonActive: {
    borderColor: '#D4A5B0',
    backgroundColor: '#F9F1F3',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B4B6B',
  },
  messageInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#8B4B6B',
    minHeight: 120,
    shadowColor: '#D4A5B0',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
});