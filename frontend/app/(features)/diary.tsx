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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  photos?: string[];
  mood?: string;
  location?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export default function DiaryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [mood, setMood] = useState('happy');
  const [photos, setPhotos] = useState<string[]>([]);

  const moods = [
    { key: 'happy', label: 'Feliz', icon: '😊' },
    { key: 'grateful', label: 'Grato', icon: '🙏' },
    { key: 'excited', label: 'Animado', icon: '🤩' },
    { key: 'peaceful', label: 'Tranquilo', icon: '😌' },
    { key: 'romantic', label: 'Romântico', icon: '😍' },
  ];

  useEffect(() => {
    loadUserData();
    loadEntries();
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

  const loadEntries = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/diary-entries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar entradas do diário');
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const createEntry = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erro', 'Digite um título e conteúdo para a entrada');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/diary-entries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          content: content,
          location: location,
          mood: mood,
          photos: photos.length > 0 ? photos : null,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowModal(false);
        loadEntries();
        Alert.alert('Sucesso', 'Entrada criada com sucesso! 📝');
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Erro ao criar entrada');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert('Erro', 'Erro de conexão');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setLocation('');
    setMood('happy');
    setPhotos([]);
  };

  const getMoodIcon = (moodKey: string) => {
    const moodObj = moods.find(m => m.key === moodKey);
    return moodObj?.icon || '😊';
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
          <Text style={styles.loadingText}>Carregando diário...</Text>
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
          <Text style={styles.title}>📝 Diário Compartilhado</Text>
          <Text style={styles.subtitle}>Momentos marcantes de vocês</Text>
        </View>
      </View>

      {/* Entries List */}
      <ScrollView style={styles.entriesList} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Nenhuma entrada ainda</Text>
            <Text style={styles.emptyText}>
              Comece registrando seus momentos especiais juntos!
            </Text>
          </View>
        ) : (
          entries.map((entry) => {
            const isOwn = entry.created_by === currentUserId;
            return (
              <View
                key={entry.id}
                style={[
                  styles.entryCard,
                  isOwn ? styles.ownEntry : styles.partnerEntry,
                ]}
              >
                <View style={styles.entryHeader}>
                  <View style={styles.entryAuthor}>
                    <Text style={styles.moodIcon}>
                      {getMoodIcon(entry.mood || 'happy')}
                    </Text>
                    <Text style={styles.authorName}>
                      {isOwn ? 'Você' : entry.created_by_name}
                    </Text>
                  </View>
                  <Text style={styles.entryDate}>
                    {formatDate(entry.created_at)}
                  </Text>
                </View>
                
                <Text style={styles.entryTitle}>{entry.title}</Text>
                
                {entry.location && (
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>{entry.location}</Text>
                  </View>
                )}
                
                <Text style={styles.entryContent}>{entry.content}</Text>
                
                {entry.photos && entry.photos.length > 0 && (
                  <ScrollView
                    horizontal
                    style={styles.photosContainer}
                    showsHorizontalScrollIndicator={false}
                  >
                    {entry.photos.map((photo, index) => (
                      <Image
                        key={index}
                        source={{ uri: photo }}
                        style={styles.entryPhoto}
                      />
                    ))}
                  </ScrollView>
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

      {/* Create Entry Modal */}
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
            <Text style={styles.modalTitle}>Nova Entrada</Text>
            <TouchableOpacity onPress={createEntry}>
              <Text style={styles.modalSendText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Título da entrada"
                placeholderTextColor="#A66B7A"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Mood Selector */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Como se sentiram?</Text>
              <View style={styles.moodGrid}>
                {moods.map((moodItem) => (
                  <TouchableOpacity
                    key={moodItem.key}
                    style={[
                      styles.moodButton,
                      mood === moodItem.key && styles.moodButtonActive,
                    ]}
                    onPress={() => setMood(moodItem.key)}
                  >
                    <Text style={styles.moodButtonIcon}>{moodItem.icon}</Text>
                    <Text style={styles.moodButtonText}>{moodItem.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Local (opcional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Onde foi?"
                placeholderTextColor="#A66B7A"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Content */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Conte sobre este momento</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Descreva este momento especial..."
                placeholderTextColor="#A66B7A"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Photos */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Fotos</Text>
              <ScrollView
                horizontal
                style={styles.photoSelector}
                showsHorizontalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={pickImage}
                >
                  <Text style={styles.addPhotoIcon}>📷</Text>
                  <Text style={styles.addPhotoText}>Adicionar</Text>
                </TouchableOpacity>
                
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoPreview}>
                    <Image source={{ uri: photo }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Text style={styles.removePhotoText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
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
  entriesList: {
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
  entryCard: {
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
  ownEntry: {
    borderColor: '#F4E6EA',
  },
  partnerEntry: {
    borderColor: '#E8F5E8',
    backgroundColor: '#F9F7F9',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4B6B',
  },
  entryDate: {
    fontSize: 12,
    color: '#A66B7A',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#A66B7A',
    fontStyle: 'italic',
  },
  entryContent: {
    fontSize: 15,
    color: '#8B4B6B',
    lineHeight: 22,
    marginBottom: 12,
  },
  photosContainer: {
    marginTop: 8,
  },
  entryPhoto: {
    width: 120,
    height: 90,
    borderRadius: 12,
    marginRight: 8,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodButton: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
  },
  moodButtonActive: {
    borderColor: '#D4A5B0',
    backgroundColor: '#F9F1F3',
  },
  moodButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  moodButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B4B6B',
  },
  photoSelector: {
    flexDirection: 'row',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F4E6EA',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addPhotoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B4B6B',
  },
  photoPreview: {
    position: 'relative',
    marginRight: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#E57373',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});