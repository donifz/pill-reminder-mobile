import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Initialize notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
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

    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medication Reminder',
        body: `Time to take ${name}`,
        data: { medicationId },
        sound: true,
      } as NotificationContent,
      trigger: {
        channelId: 'medication-reminders',
        hour: hours,
        minute: minutes,
        repeats: true,
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

  async setupNotificationListeners() {
    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const subscription = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log('Notification received:', notification);
      }
    );

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