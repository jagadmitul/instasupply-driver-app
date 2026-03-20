import { useState, useEffect } from 'react';
import { subscribeToDeliveries } from '../services/delivery.service';
import type { Delivery } from '../types';

interface DeliveriesState {
  deliveries: Delivery[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to subscribe to real-time delivery updates for the current driver
 */
export const useDeliveries = (driverId: string | null): DeliveriesState => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToDeliveries(
      driverId,
      (updatedDeliveries) => {
        setDeliveries(updatedDeliveries);
        setLoading(false);
      },
      (err) => {
        console.error('Delivery subscription error:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [driverId]);

  return { deliveries, loading, error };
};
