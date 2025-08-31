import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ResponsiveContainer from '../components/ui/ResponsiveContainer';
import Card from '../components/ui/Card';
import Header from '../components/ui/Header';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import EmptyState from '../components/ui/EmptyState';
import ApiService from '../services/ApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [messages, setMessages] = useState<LoveMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('message');
  const [currentUserId, setCurrentUserId] = useState('');

  const apiService = ApiService.getInstance();

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
      const data = await apiService.getLoveMessages();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await apiService.createLoveMessage({
        message: newMessage,
        message_type: messageType,
      });

      setNewMessage('');
      setShowModal(false);
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
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
        <ResponsiveContainer>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando mensagens de amor...</Text>
          </View>
        </ResponsiveContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ResponsiveContainer>
        <Header 
          title="💝 Mural do Amor" 
          subtitle="Mensagens românticas entre vocês"
          showBackButton={true}
        />

        <ScrollView style={styles.messagesList} showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <EmptyState
              icon="💕"
              title="Ainda não há mensagens"
              description="Que tal começar enviando uma mensagem de amor para seu parceiro(a)?"
            />
          ) : (
            messages.map((message) => {
              const isSent = message.sender_id === currentUserId;
              return (
                <Card
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
                </Card>
              );
            })
          )}
        </ScrollView>

        <FloatingActionButton onPress={() => setShowModal(true)} />

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
    fontSize: 16,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 32,
  },
  messageCard: {
    marginLeft: 0,
    marginRight: 0,
  },
  sentMessage: {
    marginLeft: 40,
    borderColor: '#F4E6EA',
  },
  receivedMessage: {
    marginRight: 40,
    borderColor: '#E8F5E8',
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