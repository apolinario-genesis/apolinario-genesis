import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationBellProps {
  onPress: () => void;
}

export default function NotificationBell({ onPress }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text style={styles.bellIcon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  bellIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E57373',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});