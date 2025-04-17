import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import axios from 'axios';

// Define background task name
const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// Register background task
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    // Check for any pending notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const now = new Date();
    
    // Process any notifications that should be shown
    for (const notification of scheduledNotifications) {
      const trigger = notification.trigger as any;
      if (trigger && trigger.hour !== undefined && trigger.minute !== undefined) {
        const scheduledTime = new Date();
        scheduledTime.setHours(trigger.hour, trigger.minute, 0, 0);
        
        // If it's time to show the notification
        if (Math.abs(scheduledTime.getTime() - now.getTime()) < 60000) { // Within 1 minute
          await Notifications.presentNotificationAsync({
            title: notification.content.title,
            body: notification.content.body,
            data: notification.content.data,
            sound: true,
            priority: 'high',
          });
        }
      }
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Initialize notification handler with background support
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

interface NotificationData {
  medicationId: string;
}

interface NotificationContent {
  title: string;
  body: string;
  data: NotificationData;
  sound?: boolean;
}

class NotificationService {
  async requestPermission() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    
    // Register background fetch task
    if (finalStatus === 'granted') {
      await this.registerBackgroundTask();
    }
    
    return finalStatus === 'granted';
  }

  async registerBackgroundTask() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 60, // 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background task registered');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  async scheduleMedicationReminder(medicationId: string, name: string, time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    let scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime < now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Schedule the notification with background support
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${name}`,
        data: { medicationId },
        sound: true,
        priority: 'high',
      } as NotificationContent,
      trigger: {
        channelId: 'medication-reminders',
        hour: hours,
        minute: minutes,
        repeats: true,
        seconds: 0,
      },
    });
  }

  async cancelMedicationReminder(medicationId: string) {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const medicationNotifications = scheduledNotifications.filter(
      (notification: Notifications.NotificationRequest) => 
        (notification.content.data as NotificationData)?.medicationId === medicationId
    );

    for (const notification of medicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }

  async registerFcmToken() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '355ce659-e8ea-410b-aad2-f611ef000471',
      });

      // Send token to backend
      await axios.post('/api/notifications/fcm-token', { token: token.data });
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  async setupNotificationListeners() {
    // Create notification channel for Android with high priority
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        enableVibrate: true,
        enableLights: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: true,
      });
    }

    // Register FCM token
    await this.registerFcmToken();

    // Handle notifications when app is in foreground
    const subscription = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Handle notification response (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification response:', response);
      }
    );

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }
}

export const notificationService = new NotificationService(); 