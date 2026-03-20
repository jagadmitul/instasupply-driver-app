import { messaging, firestore } from '../config/firebase';
import { Platform } from 'react-native';

/**
 * Request notification permissions and store the FCM token in Firestore
 */
export const registerForPushNotifications = async (
  userId: string,
): Promise<string | null> => {
  try {
    // Request permission (required on iOS, Android 13+)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Push notification permission denied');
      return null;
    }

    // Get the FCM token
    const token = await messaging().getToken();

    // Store the token in Firestore
    await firestore().collection('users').doc(userId).update({
      fcmToken: token,
      fcmTokenPlatform: Platform.OS,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return token;
  } catch (error) {
    console.error('Failed to register for push notifications:', error);
    return null;
  }
};

/**
 * Listen for FCM token refresh and update Firestore
 */
export const onTokenRefresh = (userId: string) => {
  return messaging().onTokenRefresh(async (newToken) => {
    await firestore().collection('users').doc(userId).update({
      fcmToken: newToken,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });
};

/**
 * Set up foreground notification handler
 */
export const onForegroundMessage = (
  handler: (remoteMessage: { title?: string; body?: string; data?: Record<string, string> }) => void,
) => {
  return messaging().onMessage(async (remoteMessage) => {
    handler({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data as Record<string, string> | undefined,
    });
  });
};

/**
 * Set up background/killed state notification handler.
 * Must be called at the top level (outside of any component).
 */
export const setBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage.messageId);
  });
};

/**
 * Get the notification that opened the app from killed state
 */
export const getInitialNotification = async () => {
  const remoteMessage = await messaging().getInitialNotification();
  return remoteMessage;
};

/**
 * Listen for notification taps when app is in background
 */
export const onNotificationOpenedApp = (
  handler: (data?: Record<string, string>) => void,
) => {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    handler(remoteMessage.data as Record<string, string> | undefined);
  });
};
