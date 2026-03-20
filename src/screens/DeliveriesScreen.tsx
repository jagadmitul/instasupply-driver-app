import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { useDeliveries } from '../hooks/useDeliveries';
import { updateDeliveryStatus } from '../services/delivery.service';
import {
  registerForPushNotifications,
  onTokenRefresh,
  onForegroundMessage,
} from '../services/notification.service';
import { signOut } from '../services/auth.service';
import { DeliveryCard } from '../components/DeliveryCard';
import type { Delivery, DeliveryStatus, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Deliveries'>;

/**
 * Main deliveries screen — shows all deliveries assigned to the driver
 */
export const DeliveriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { deliveries, loading, error } = useDeliveries(user?.uid ?? null);

  const pendingCount = deliveries.filter(
    (d) => d.status !== 'delivered',
  ).length;

  // Register for push notifications on mount
  useEffect(() => {
    if (!user?.uid) return;

    registerForPushNotifications(user.uid);
    const unsubRefresh = onTokenRefresh(user.uid);

    // Handle foreground notifications
    const unsubMessage = onForegroundMessage(({ title, body }) => {
      Alert.alert(title || 'New Delivery', body || 'You have a new delivery assignment');
    });

    return () => {
      unsubRefresh();
      unsubMessage();
    };
  }, [user?.uid]);

  const handleUpdateStatus = useCallback(
    async (deliveryId: string, status: DeliveryStatus) => {
      try {
        await updateDeliveryStatus(deliveryId, status);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        Alert.alert('Error', message);
      }
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      Alert.alert('Error', message);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Delivery }) => (
      <DeliveryCard delivery={item} onUpdateStatus={handleUpdateStatus} />
    ),
    [handleUpdateStatus],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Loading deliveries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load deliveries</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Deliveries</Text>
          <Text style={styles.subtitle}>
            {deliveries.length} total | {pendingCount} pending
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No deliveries assigned yet</Text>
          </View>
        }
      />

      {pendingCount > 0 && (
        <TouchableOpacity
          style={styles.optimiseButton}
          onPress={() => navigation.navigate('OptimisedRoute')}
          activeOpacity={0.8}
        >
          <Text style={styles.optimiseText}>
            Optimise Route ({pendingCount} stops)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A5F',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  errorDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  optimiseButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  optimiseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
