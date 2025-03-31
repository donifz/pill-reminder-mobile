import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import './src/services/axios';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await notificationService.requestPermission();
        await notificationService.setupNotificationListeners();
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
