import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import './src/services/axios';
import { notificationService } from './src/services/notificationService';
import { initializeLanguage } from './src/i18n';
import './src/i18n';
import registerNNPushToken from 'native-notify';

export default function App() {
  registerNNPushToken(29362, 'T4ZZ7Dr9rTcFVXG4QHiRyp');
  useEffect(() => {
    const setup = async () => {
      try {
        await notificationService.requestPermission();
        await notificationService.setupNotificationListeners();
        await initializeLanguage();
      } catch (error) {
        console.error('Error during setup:', error);
      }
    };

    setup();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
