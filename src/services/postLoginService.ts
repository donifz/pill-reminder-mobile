import NotificationService from './notificationService';

class PostLoginService {
  private static instance: PostLoginService;

  private constructor() {}

  public static getInstance(): PostLoginService {
    if (!PostLoginService.instance) {
      PostLoginService.instance = new PostLoginService();
    }
    return PostLoginService.instance;
  }

  public async handlePostLoginTasks(): Promise<void> {
    try {
      // Register FCM token after successful login
      const notificationService = NotificationService.getInstance();
      await notificationService.registerFcmToken();
    } catch (error) {
      console.error('Error in post-login tasks:', error);
    }
  }
}

export default PostLoginService; 