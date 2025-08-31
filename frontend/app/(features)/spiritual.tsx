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

interface SpiritualContent {
  id: string;
  content_type: string;
  title: string;
  content: string;
  bible_verse?: string;
  bible_reference?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export default function SpiritualScreen() {
  const router = useRouter();
  const [contents, setContents] = useState<SpiritualContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('prayer');
  const [bibleVerse, setBibleVerse] = useState('');
  const [bibleReference, setBibleReference] = useState('');

  const contentTypes = [
    { key: 'prayer', label: 'Oração', icon: '🙏' },
    { key: 'reflection', label: 'Reflexão', icon: '💭' },
    { key: 'verse_study', label: 'Estudo Bíblico', icon: '📖' },
  ];

  const filterTypes = [
    { key: 'all', label: 'Todos', icon: '📋' },
    ...contentTypes,
  ];

  useEffect(() => {
    loadUserData();
    loadContents();
  }, [selectedType]);

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

  const loadContents = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const url = selectedType === 'all' 
        ? `${BACKEND_URL}/api/spiritual-content`
        : `${BACKEND_URL}/api/spiritual-content?content_type=${selectedType}`;
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContents(data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar conteúdo espiritual');
      }
    } catch (error) {
      console.error('Error loading contents:', error);
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const createContent = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erro', 'Digite um título e conteúdo');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/spiritual-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          title: title,
          content: content,
          bible_verse: bibleVerse || null,
          bible_reference: bibleReference || null,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowModal(false);
        loadContents();
        Alert.alert('Sucesso', 'Conteúdo criado com sucesso! 🙏');
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Erro ao criar conteúdo');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      Alert.alert('Erro', 'Erro de conexão');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setContentType('prayer');
    setBibleVerse('');
    setBibleReference('');
  };

  const getContentIcon = (type: string) => {
    const contentType = contentTypes.find(t => t.key === type);
    return contentType?.icon || '📝';
  };

  const getContentTypeLabel = (type: string) => {
    const contentType = contentTypes.find(t => t.key === type);
    return contentType?.label || 'Conteúdo';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando conteúdo espiritual...</Text>
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
          <Text style={styles.title}>📖 Espaço Espiritual</Text>
          <Text style={styles.subtitle}>Orações, reflexões e estudos bíblicos</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        style={styles.filterTabs}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContent}
      >
        {filterTypes.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.filterTab,
              selectedType === type.key && styles.activeFilterTab,
            ]}
            onPress={() => setSelectedType(type.key)}
          >
            <Text style={styles.filterIcon}>{type.icon}</Text>
            <Text style={[
              styles.filterLabel,
              selectedType === type.key && styles.activeFilterLabel,
            ]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content List */}
      <ScrollView style={styles.contentList} showsVerticalScrollIndicator={false}>
        {contents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🙏</Text>
            <Text style={styles.emptyTitle}>Nenhum conteúdo ainda</Text>
            <Text style={styles.emptyText}>
              Comece compartilhando suas orações, reflexões ou estudos bíblicos
            </Text>
          </View>
        ) : (
          contents.map((item) => {
            const isOwn = item.created_by === currentUserId;
            return (
              <View
                key={item.id}
                style={[
                  styles.contentCard,
                  isOwn ? styles.ownContent : styles.partnerContent,
                ]}
              >
                <View style={styles.contentHeader}>
                  <View style={styles.contentAuthor}>
                    <Text style={styles.contentTypeIcon}>
                      {getContentIcon(item.content_type)}
                    </Text>
                    <View>
                      <Text style={styles.authorName}>
                        {isOwn ? 'Você' : item.created_by_name}
                      </Text>
                      <Text style={styles.contentTypeText}>
                        {getContentTypeLabel(item.content_type)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.contentDate}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
                
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentText}>{item.content}</Text>
                
                {item.bible_verse && (
                  <View style={styles.bibleVerseContainer}>
                    <Text style={styles.bibleVerseIcon}>📖</Text>
                    <View style={styles.bibleVerseContent}>
                      <Text style={styles.bibleVerse}>"{item.bible_verse}"</Text>
                      {item.bible_reference && (
                        <Text style={styles.bibleReference}>
                          {item.bible_reference}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
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

      {/* Create Content Modal */}
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
            <Text style={styles.modalTitle}>Novo Conteúdo</Text>
            <TouchableOpacity onPress={createContent}>
              <Text style={styles.modalSendText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Content Type Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tipo de Conteúdo</Text>
              <View style={styles.typeSelector}>
                {contentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      contentType === type.key && styles.typeButtonActive,
                    ]}
                    onPress={() => setContentType(type.key)}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={styles.typeText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Título do conteúdo"
                placeholderTextColor="#A66B7A"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Content */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Conteúdo</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder={`Escreva sua ${contentType === 'prayer' ? 'oração' : contentType === 'reflection' ? 'reflexão' : 'estudo'}...`}
                placeholderTextColor="#A66B7A"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Bible Verse (optional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Versículo Bíblico (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Digite o versículo..."
                placeholderTextColor="#A66B7A"
                value={bibleVerse}
                onChangeText={setBibleVerse}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Bible Reference */}
            {bibleVerse && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Referência</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: João 3:16"
                  placeholderTextColor="#A66B7A"
                  value={bibleReference}
                  onChangeText={setBibleReference}
                />
              </View>
            )}
          </ScrollView>
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
  filterTabs: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  filterTabsContent: {
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
  },
  activeFilterTab: {
    borderColor: '#D4A5B0',
    backgroundColor: '#F9F1F3',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4B6B',
  },
  activeFilterLabel: {
    color: '#D4A5B0',
  },
  contentList: {
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
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  ownContent: {
    borderColor: '#F4E6EA',
  },
  partnerContent: {
    borderColor: '#E8F5E8',
    backgroundColor: '#F9F7F9',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentTypeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4B6B',
  },
  contentTypeText: {
    fontSize: 12,
    color: '#A66B7A',
  },
  contentDate: {
    fontSize: 12,
    color: '#A66B7A',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 15,
    color: '#8B4B6B',
    lineHeight: 22,
    marginBottom: 12,
  },
  bibleVerseContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9F1F3',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  bibleVerseIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  bibleVerseContent: {
    flex: 1,
  },
  bibleVerse: {
    fontSize: 15,
    color: '#8B4B6B',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 4,
  },
  bibleReference: {
    fontSize: 13,
    color: '#D4A5B0',
    fontWeight: '600',
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
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4B6B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#8B4B6B',
    minHeight: 56,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
});