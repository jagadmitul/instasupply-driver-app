import { firestore } from '../config/firebase';
import type { Delivery, DeliveryStatus } from '../types';

const COLLECTION = 'deliveries';

/**
 * Subscribe to real-time delivery updates for a specific driver
 */
export const subscribeToDeliveries = (
  driverId: string,
  onUpdate: (deliveries: Delivery[]) => void,
  onError: (error: Error) => void,
) => {
  return firestore()
    .collection(COLLECTION)
    .where('driverId', '==', driverId)
    .onSnapshot(
      (snapshot) => {
        const deliveries: Delivery[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Delivery[];
        onUpdate(deliveries);
      },
      (error) => {
        onError(error);
      },
    );
};

/**
 * Update the status of a delivery
 */
export const updateDeliveryStatus = async (
  deliveryId: string,
  status: DeliveryStatus,
): Promise<void> => {
  if (!deliveryId?.trim()) {
    throw new Error('Invalid delivery ID');
  }

  const validStatuses: DeliveryStatus[] = ['pending', 'picked_up', 'in_transit', 'delivered'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid delivery status: ${status}`);
  }

  await firestore().collection(COLLECTION).doc(deliveryId).update({
    status,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

/**
 * Get all pending deliveries for a driver (non-realtime, for route optimization)
 */
export const getPendingDeliveries = async (
  driverId: string,
): Promise<Delivery[]> => {
  const snapshot = await firestore()
    .collection(COLLECTION)
    .where('driverId', '==', driverId)
    .where('status', 'in', ['pending', 'picked_up', 'in_transit'])
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Delivery[];
};
