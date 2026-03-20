import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import type { RouteStop } from '../types';

interface StopCardProps {
  stop: RouteStop;
  index: number;
  onMarkDelivered: (deliveryId: string) => void;
}

/**
 * Card for a single stop in the optimised route list
 */
export const StopCard: React.FC<StopCardProps> = ({ stop, index, onMarkDelivered }) => {
  const { delivery, distanceText, durationText } = stop;
  const isDelivered = delivery.status === 'delivered';

  return (
    <View style={[styles.card, isDelivered && styles.cardDelivered]}>
      <View style={styles.indexContainer}>
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.orderId}>#{delivery.orderId}</Text>
          <StatusBadge status={delivery.status} />
        </View>

        <Text style={styles.customerName}>{delivery.customerName}</Text>
        <Text style={styles.address}>{delivery.customerAddress}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{distanceText}</Text>
          <Text style={styles.metaDivider}>|</Text>
          <Text style={styles.metaText}>{durationText}</Text>
        </View>

        {!isDelivered && (
          <TouchableOpacity
            style={styles.deliverButton}
            onPress={() => onMarkDelivered(delivery.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.deliverText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDelivered: {
    opacity: 0.5,
  },
  indexContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  indexText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaDivider: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 6,
  },
  deliverButton: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deliverText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
