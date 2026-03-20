import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DeliveryStatus } from '../types';

interface StatusBadgeProps {
  status: DeliveryStatus;
}

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#92400E' },
  picked_up: { label: 'Picked Up', bg: '#DBEAFE', text: '#1E40AF' },
  in_transit: { label: 'In Transit', bg: '#E0E7FF', text: '#3730A3' },
  delivered: { label: 'Delivered', bg: '#D1FAE5', text: '#065F46' },
};

/**
 * Colored status badge for delivery status
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
