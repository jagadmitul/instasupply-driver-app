import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBadge } from './StatusBadge';
import type { Delivery, DeliveryStatus } from '../types';

interface DeliveryCardProps {
  delivery: Delivery;
  onUpdateStatus: (deliveryId: string, status: DeliveryStatus) => void;
}

const NEXT_STATUS: Partial<Record<DeliveryStatus, { label: string; status: DeliveryStatus }>> = {
  pending: { label: 'Mark Picked Up', status: 'picked_up' },
  picked_up: { label: 'Start Transit', status: 'in_transit' },
  in_transit: { label: 'Mark Delivered', status: 'delivered' },
};

/**
 * Card displaying a single delivery with status update action
 */
export const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery, onUpdateStatus }) => {
  const nextAction = NEXT_STATUS[delivery.status];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>#{delivery.orderId}</Text>
        <StatusBadge status={delivery.status} />
      </View>

      <Text style={styles.customerName}>{delivery.customerName}</Text>
      <Text style={styles.address}>{delivery.customerAddress}</Text>

      {nextAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onUpdateStatus(delivery.id, nextAction.status)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>{nextAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
