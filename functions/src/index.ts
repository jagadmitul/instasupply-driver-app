import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

const db = getFirestore();
const fcm = getMessaging();

interface DeliveryData {
  orderId: string;
  driverId: string;
  customerName: string;
  customerAddress: string;
}

/**
 * Cloud Function that triggers when a new delivery document is added to Firestore.
 * Sends a push notification to the assigned driver via FCM.
 */
export const onDeliveryCreated = onDocumentCreated(
  'deliveries/{deliveryId}',
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log('No data associated with the event');
      return;
    }

    const delivery = snapshot.data() as DeliveryData;
    const { driverId, orderId, customerName, customerAddress } = delivery;

    if (!driverId) {
      console.error('Delivery has no assigned driver');
      return;
    }

    // Get the driver's FCM token from Firestore
    const userDoc = await db.collection('users').doc(driverId).get();
    const userData = userDoc.data();

    if (!userData?.fcmToken) {
      console.warn(`No FCM token found for driver ${driverId}`);
      return;
    }

    const fcmToken: string = userData.fcmToken;

    // Send push notification
    try {
      await fcm.send({
        token: fcmToken,
        notification: {
          title: 'New Delivery Assigned',
          body: `Order #${orderId} — ${customerName} at ${customerAddress}`,
        },
        data: {
          screen: 'Deliveries',
          deliveryId: event.params.deliveryId,
          orderId: orderId,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'deliveries',
            priority: 'high',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: 'New Delivery Assigned',
                body: `Order #${orderId} — ${customerName} at ${customerAddress}`,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      console.log(`Push notification sent to driver ${driverId} for delivery ${event.params.deliveryId}`);
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  },
);
