import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import axios from 'axios';
import { getApiUrl } from '../config';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { i18n } from '../translations/i18n';

// Check if running in simulator
const isSimulator = Constants.isDevice === false;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Define the background task name
const BACKGROUND_FETCH_TASK = 'BACKGROUND_FETCH_TASK';

// Register the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Since there's no check-scheduled endpoint, we'll just return success
    // The backend will handle sending notifications via its cron job
    console.log('Background fetch task executed');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class NotificationService {
  private static instance: NotificationService;
  private notificationListener: any = null;
  private responseListener: any = null;
  private isSimulator: boolean;
  private fcmToken: string | null = null;
  private t: any;

  private constructor() {
    this.isSimulator = isSimulator;
    if (!this.isSimulator) {
      this.setupNotificationListeners();
    } else {
      console.log('Running in simulator - push notifications are not supported');
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async setupNotificationListeners() {
    // Request permission for notifications
    await this.requestPermission();

    // Register background task
    await this.registerBackgroundTask();

    // Set up notification listeners
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotification
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  private handleNotification = (notification: any) => {
    console.log('Notification received:', notification);
    // Handle foreground notifications
    if (notification.request.content.data) {
      // Process notification data
      const { title, body, data } = notification.request.content;
      console.log('Notification data:', { title, body, data });
    }
  };

  private handleNotificationResponse = (response: any) => {
    console.log('Notification response:', response);
    // Handle notification interaction
    const { notification } = response;
    if (notification.request.content.data) {
      // Process notification interaction data
      const { title, body, data } = notification.request.content;
      console.log('Notification interaction data:', { title, body, data });
    }
  };

  public async requestPermission(): Promise<boolean> {
    if (this.isSimulator) {
      console.log('Running in simulator - push notifications are not supported');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }
      
      // Configure Android notification channel
      await this.configureAndroidChannel();
      
      // Get the token - we don't need to use the return value here
      await this.registerFcmToken();
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private async registerBackgroundTask() {
    if (this.isSimulator) {
      console.log('Running in simulator - background tasks are not supported');
      return;
    }

    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background task registered');
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  private async configureAndroidChannel() {
    if (this.isSimulator) {
      console.log('Running in simulator - Android notification channel configuration skipped');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }

  private async getFcmToken(): Promise<string> {
    if (this.isSimulator) {
      console.log('Running in simulator - FCM token not available');
      throw new Error('Push notifications are not supported in simulator');
    }

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted, cannot get FCM token');
      throw new Error('Notification permission not granted');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '355ce659-e8ea-410b-aad2-f611ef000471',
    });

    return token.data;
  }

  public async registerFcmToken(): Promise<string> {
    if (this.isSimulator) {
      console.log('Running in simulator - FCM token registration skipped');
      return 'simulator-token';
    }

    try {
      console.log('Starting FCM token registration...');
      const token = await this.getFcmToken();
      console.log('Got FCM token:', token);

      if (!token) {
        console.log('No FCM token available');
        throw new Error('Failed to get FCM token');
      }

      // Store the token
      this.fcmToken = token;

      const API_URL = getApiUrl();
      console.log('Registering FCM token with backend...');
      
      // Get the auth token
      const authToken = await AsyncStorage.getItem('token');
      if (!authToken) {
        console.log('No auth token found, skipping FCM token registration until user is authenticated');
        return token;
      }
      
      try {
        const response = await axios.post(
          `${API_URL}/notifications/fcm-token`,
          { token },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            validateStatus: (status: number): boolean => status >= 200 && status < 300,
          }
        );

        console.log('FCM token registration response:', response.status);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log('User not authenticated, FCM token will be registered after login');
        } else {
          console.error('Error registering FCM token:', error);
          if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message,
            });
          }
        }
      }

      return token;
    } catch (error) {
      console.error('Error in registerFcmToken:', error);
      throw error;
    }
  }

  public async initialize(): Promise<void> {
    if (this.isSimulator) {
      console.log('Running in simulator - notification service initialization limited');
      return;
    }

    try {
      console.log('Initializing notification service...');
      
      // Clean up any existing listeners first
      this.cleanup();
      
      // Configure Android channel first
      await this.configureAndroidChannel();
      
      // Register background task
      await this.registerBackgroundTask();
      
      // Request permission and register FCM token on initialization
      const hasPermission = await this.requestPermission();
      if (hasPermission) {
        console.log('Notification permission granted, registering FCM token...');
        await this.registerFcmToken();
      } else {
        console.log('Notification permission denied');
      }
    } catch (error) {
      console.error('Error initializing notification service:', error);
      // Don't throw the error, just log it and continue
      // This prevents the app from crashing if notification setup fails
    }
  }

  // Call this method after user login to ensure FCM token is registered
  public async onUserLogin(): Promise<void> {
    if (this.isSimulator) {
      console.log('Running in simulator - FCM token registration skipped after login');
      return;
    }

    try {
      console.log('Registering FCM token after user login...');
      await this.registerFcmToken();
    } catch (error) {
      console.error('Error registering FCM token after login:', error);
      throw error;
    }
  }

  async scheduleMedicationReminder(
    medicationId: string,
    medicationName: string,
    time: string
  ): Promise<string> {
    if (this.isSimulator) {
      console.log('Running in simulator - scheduling local notification instead of push');
      // For simulator, we'll schedule a local notification that will appear immediately
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.reminder'),
          body: i18n.t('notifications.timeToTake') + ` ${medicationName}`,
          data: { medicationId, time },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          seconds: 5, // Show after 5 seconds
        } as any, // Type assertion to fix linter error
      });
      return identifier;
    }

    try {
      // Parse the time string (format: "HH:MM")
      const [hours, minutes] = time.split(':').map(Number);
      
      // Create a date object for the next occurrence of this time
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0
      );
      
      // If the time has already passed today, schedule for tomorrow
      if (scheduledTime.getTime() <= now.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      // Schedule the notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.reminder'),
          body: i18n.t('notifications.timeToTake') + ` ${medicationName}`,
          data: { medicationId, time },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any, // Type assertion to fix linter error
      });
      
      console.log(`Scheduled notification for ${medicationName} at ${time} with ID: ${identifier}`);
      return identifier;
    } catch (error) {
      console.error('Error scheduling medication reminder:', error);
      throw error;
    }
  }

  async cancelMedicationReminder(medicationId: string): Promise<void> {
    if (this.isSimulator) {
      console.log('Running in simulator - medication reminder cancellation skipped');
      return;
    }

    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel notifications for this medication
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.medicationId === medicationId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`Cancelled notification with ID: ${notification.identifier}`);
        }
      }
    } catch (error) {
      console.error('Error cancelling medication reminder:', error);
      throw error;
    }
  }

  public cleanup() {
    try {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }
    } catch (error) {
      console.error('Error cleaning up notification listeners:', error);
    }
  }
}

export default NotificationService; 