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
import { format, parseISO, isSameDay, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_type: string;
  is_reminder: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export default function CalendarScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('general');
  const [eventDate, setEventDate] = useState(new Date());
  const [isReminder, setIsReminder] = useState(true);

  const eventTypes = [
    { key: 'general', label: 'Geral', icon: '📅' },
    { key: 'anniversary', label: 'Aniversário', icon: '🎉' },
    { key: 'date', label: 'Encontro', icon: '💕' },
    { key: 'religious', label: 'Religioso', icon: '🙏' },
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        Alert.alert('Erro', 'Erro ao carregar eventos');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Digite um título para o evento');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          description: description,
          event_date: eventDate.toISOString(),
          event_type: eventType,
          is_reminder: isReminder,
        }),
      });

      if (response.ok) {
        resetForm();
        setShowModal(false);
        loadEvents();
        Alert.alert('Sucesso', 'Evento criado com sucesso! 📅');
      } else {
        const error = await response.json();
        Alert.alert('Erro', error.detail || 'Erro ao criar evento');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Erro', 'Erro de conexão');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEventType('general');
    setEventDate(new Date());
    setIsReminder(true);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.event_date), date)
    );
  };

  const getEventTypeIcon = (type: string) => {
    const eventType = eventTypes.find(t => t.key === type);
    return eventType?.icon || '📅';
  };

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const generateWeekDates = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(start, i));
    }
    return dates;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando agenda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weekDates = generateWeekDates();
  const selectedDateEvents = getEventsForDate(selectedDate);

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
          <Text style={styles.title}>📅 Agenda do Casal</Text>
          <Text style={styles.subtitle}>Datas importantes e compromissos</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          <Text style={styles.monthText}>
            {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </Text>
          <View style={styles.weekDays}>
            {weekDates.map((date, index) => {
              const isSelected = isSameDay(date, selectedDate);
              const hasEvents = getEventsForDate(date).length > 0;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    isSelected && styles.selectedDay,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.dayLabel,
                    isSelected && styles.selectedDayLabel,
                  ]}>
                    {format(date, 'EEE', { locale: ptBR }).toUpperCase()}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    isSelected && styles.selectedDayNumber,
                  ]}>
                    {format(date, 'd')}
                  </Text>
                  {hasEvents && (
                    <View style={[
                      styles.eventDot,
                      isSelected && styles.selectedEventDot,
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Events for Selected Date */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>
            Eventos para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </Text>
          
          {selectedDateEvents.length === 0 ? (
            <View style={styles.noEventsContainer}>
              <Text style={styles.noEventsIcon}>📅</Text>
              <Text style={styles.noEventsText}>
                Nenhum evento para este dia
              </Text>
            </View>
          ) : (
            selectedDateEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventIcon}>
                    {getEventTypeIcon(event.event_type)}
                  </Text>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventCreator}>
                      Por {event.created_by_name}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>
                    {format(parseISO(event.event_date), 'HH:mm')}
                  </Text>
                </View>
                {event.description && (
                  <Text style={styles.eventDescription}>
                    {event.description}
                  </Text>
                )}
                {event.is_reminder && (
                  <View style={styles.reminderBadge}>
                    <Text style={styles.reminderText}>🔔 Lembrete ativo</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* All Upcoming Events */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Próximos Eventos</Text>
          {events.slice(0, 5).map((event) => (
            <View key={event.id} style={styles.upcomingEventCard}>
              <Text style={styles.eventIcon}>
                {getEventTypeIcon(event.event_type)}
              </Text>
              <View style={styles.upcomingEventInfo}>
                <Text style={styles.upcomingEventTitle}>{event.title}</Text>
                <Text style={styles.upcomingEventDate}>
                  {formatEventDate(event.event_date)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Event Modal */}
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
            <Text style={styles.modalTitle}>Novo Evento</Text>
            <TouchableOpacity onPress={createEvent}>
              <Text style={styles.modalSendText}>Criar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Event Title */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nome do evento"
                placeholderTextColor="#A66B7A"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Event Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Detalhes do evento"
                placeholderTextColor="#A66B7A"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Event Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tipo de Evento</Text>
              <View style={styles.typeGrid}>
                {eventTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      eventType === type.key && styles.typeButtonActive,
                    ]}
                    onPress={() => setEventType(type.key)}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={styles.typeText}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reminder Toggle */}
            <View style={styles.reminderContainer}>
              <Text style={styles.inputLabel}>Lembrete</Text>
              <TouchableOpacity
                style={styles.reminderToggle}
                onPress={() => setIsReminder(!isReminder)}
              >
                <View style={[
                  styles.reminderSwitch,
                  isReminder && styles.reminderSwitchActive,
                ]}>
                  <View style={[
                    styles.reminderThumb,
                    isReminder && styles.reminderThumbActive,
                  ]} />
                </View>
                <Text style={styles.reminderLabel}>
                  {isReminder ? 'Ativo' : 'Inativo'}
                </Text>
              </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  weekCalendar: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 42,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#D4A5B0',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A66B7A',
    marginBottom: 4,
  },
  selectedDayLabel: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4B6B',
  },
  selectedDayNumber: {
    color: '#FFFFFF',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4A5B0',
    position: 'absolute',
    bottom: 4,
  },
  selectedEventDot: {
    backgroundColor: '#FFFFFF',
  },
  eventsSection: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 16,
  },
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEventsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 14,
    color: '#A66B7A',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B4B6B',
    marginBottom: 2,
  },
  eventCreator: {
    fontSize: 12,
    color: '#A66B7A',
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A5B0',
  },
  eventDescription: {
    fontSize: 14,
    color: '#8B4B6B',
    lineHeight: 20,
    marginTop: 8,
  },
  reminderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F9F1F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  reminderText: {
    fontSize: 12,
    color: '#8B4B6B',
    fontWeight: '500',
  },
  upcomingSection: {
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F4E6EA',
  },
  upcomingEventInfo: {
    marginLeft: 12,
    flex: 1,
  },
  upcomingEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4B6B',
    marginBottom: 2,
  },
  upcomingEventDate: {
    fontSize: 12,
    color: '#A66B7A',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  reminderContainer: {
    marginBottom: 32,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4E6EA',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginRight: 12,
  },
  reminderSwitchActive: {
    backgroundColor: '#D4A5B0',
  },
  reminderThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  reminderThumbActive: {
    alignSelf: 'flex-end',
  },
  reminderLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4B6B',
  },
});