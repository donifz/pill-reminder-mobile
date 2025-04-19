import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';
import NotificationService from '../services/notificationService';
import Constants from 'expo-constants';

export default function NotificationTestScreen() {
  const [permissionStatus, setPermissionStatus] = useState<string>('Not checked');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const isSimulator = Constants.isDevice === false;

  // Initialize notification service when component mounts
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Initialize the notification service
        await NotificationService.getInstance().initialize();
        
        // Register FCM token after "login" (for testing purposes)
        await NotificationService.getInstance().onUserLogin();
        
        // Get the current FCM token
        const token = await NotificationService.getInstance().registerFcmToken();
        setFcmToken(token);
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };
    
    initializeNotifications();
    
    // Cleanup when component unmounts
    return () => {
      NotificationService.getInstance().cleanup();
    };
  }, []);

  const testNotifications = async () => {
    try {
      if (isSimulator) {
        Alert.alert(
          'Simulator Mode',
          'Push notifications are not supported in the simulator. A local notification will be scheduled instead.',
          [
            {
              text: 'Continue',
              onPress: async () => {
                // Request permission
                const hasPermission = await NotificationService.getInstance().requestPermission();
                setPermissionStatus(hasPermission ? 'Granted (Simulator)' : 'Denied (Simulator)');

                if (hasPermission) {
                  // Schedule a test notification for 5 seconds from now
                  const testTime = new Date();
                  testTime.setSeconds(testTime.getSeconds() + 5);
                  const timeString = testTime.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  await NotificationService.getInstance().scheduleMedicationReminder(
                    'test-medication-id',
                    'Test Medication',
                    timeString
                  );

                  Alert.alert(
                    'Test Notification Scheduled',
                    'A test notification will appear in 5 seconds.'
                  );
                }
              }
            }
          ]
        );
        return;
      }

      // Request permission
      const hasPermission = await NotificationService.getInstance().requestPermission();
      setPermissionStatus(hasPermission ? 'Granted' : 'Denied');

      if (hasPermission) {
        // Register FCM token
        const token = await NotificationService.getInstance().registerFcmToken();
        setFcmToken(token);

        // Schedule a test notification for 5 seconds from now
        const testTime = new Date();
        testTime.setSeconds(testTime.getSeconds() + 5);
        const timeString = testTime.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        await NotificationService.getInstance().scheduleMedicationReminder(
          'test-medication-id',
          'Test Medication',
          timeString
        );

        Alert.alert(
          'Test Notification Scheduled',
          `A test notification will appear in 5 seconds.\nFCM Token: ${token}`
        );
      }
    } catch (error) {
      console.error('Error testing notifications:', error);
      Alert.alert('Error', 'Failed to test notifications. Check console for details.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test Screen</Text>
      {isSimulator && (
        <View style={styles.simulatorWarning}>
          <Text style={styles.simulatorWarningText}>
            Running in simulator - Push notifications are not supported. Local notifications will be used instead.
          </Text>
        </View>
      )}
      <Text style={styles.status}>Permission Status: {permissionStatus}</Text>
      {fcmToken && (
        <Text style={styles.token}>FCM Token: {fcmToken}</Text>
      )}
      <Button
        title="Test Notifications"
        onPress={testNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
  },
  token: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  simulatorWarning: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  simulatorWarningText: {
    color: '#856404',
    textAlign: 'center',
  },
}); 