import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: any;
  maxWidth?: number;
}

export default function ResponsiveContainer({ 
  children, 
  style, 
  maxWidth = 600 
}: ResponsiveContainerProps) {
  const screenWidth = Dimensions.get('window').width;
  const isDesktop = screenWidth > 768;

  return (
    <View style={[
      styles.container,
      isDesktop && { maxWidth, alignSelf: 'center' },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});