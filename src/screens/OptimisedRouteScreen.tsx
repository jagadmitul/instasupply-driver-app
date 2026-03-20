import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import { getPendingDeliveries, updateDeliveryStatus } from '../services/delivery.service';
import { optimiseRoute } from '../services/route.service';
import { StopCard } from '../components/StopCard';
import type { Delivery, OptimisedRoute, RouteStop } from '../types';

/**
 * Optimised route screen — map view with ordered stops and route polyline
 */
export const OptimisedRouteScreen: React.FC = () => {
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [route, setRoute] = useState<OptimisedRoute | null>(null);
  const [loading, setLoading] = useState(true);

  // Get driver's current location
  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for route optimization.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setDriverLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    getLocation();
  }, []);

  // Fetch deliveries and optimize route
  const loadAndOptimise = useCallback(async () => {
    if (!user?.uid || !driverLocation) return;

    setLoading(true);
    try {
      const pending = await getPendingDeliveries(user.uid);
      setDeliveries(pending);

      if (pending.length > 0) {
        const optimised = await optimiseRoute(driverLocation, pending);
        setRoute(optimised);

        // Fit map to show all markers
        if (mapRef.current && pending.length > 0) {
          const allCoords = [
            driverLocation,
            ...pending.map((d) => ({ latitude: d.latitude, longitude: d.longitude })),
          ];
          mapRef.current.fitToCoordinates(allCoords, {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          });
        }
      } else {
        setRoute(null);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
      Alert.alert('Error', 'Failed to optimize route. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, driverLocation]);

  useEffect(() => {
    loadAndOptimise();
  }, [loadAndOptimise]);

  const handleMarkDelivered = useCallback(
    async (deliveryId: string) => {
      try {
        await updateDeliveryStatus(deliveryId, 'delivered');

        // Re-optimise route for remaining stops
        await loadAndOptimise();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update';
        Alert.alert('Error', message);
      }
    },
    [loadAndOptimise],
  );

  const renderStopItem = useCallback(
    ({ item, index }: { item: RouteStop; index: number }) => (
      <StopCard stop={item} index={index} onMarkDelivered={handleMarkDelivered} />
    ),
    [handleMarkDelivered],
  );

  if (!driverLocation) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E3A5F" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Driver marker */}
        <Marker
          coordinate={driverLocation}
          title="Your Location"
          pinColor="#1E3A5F"
        />

        {/* Delivery stop markers */}
        {(route?.stops || []).map((stop, index) => (
          <Marker
            key={stop.delivery.id}
            coordinate={{
              latitude: stop.delivery.latitude,
              longitude: stop.delivery.longitude,
            }}
            title={`Stop ${index + 1}: ${stop.delivery.customerName}`}
            description={stop.delivery.customerAddress}
            pinColor={stop.delivery.status === 'delivered' ? '#9CA3AF' : '#059669'}
          />
        ))}

        {/* Route polyline */}
        {route && route.polylinePoints.length > 0 && (
          <Polyline
            coordinates={route.polylinePoints}
            strokeColor="#1E3A5F"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Route summary */}
      {route && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {route.stops.length} stops | {route.totalDistanceText} | {route.totalDurationText}
          </Text>
        </View>
      )}

      {/* Stop list */}
      {loading ? (
        <View style={styles.listLoading}>
          <ActivityIndicator size="small" color="#1E3A5F" />
          <Text style={styles.loadingText}>Optimizing route...</Text>
        </View>
      ) : (
        <FlatList
          data={route?.stops || []}
          keyExtractor={(item) => item.delivery.id}
          renderItem={renderStopItem}
          contentContainerStyle={styles.stopList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No pending deliveries</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  map: {
    height: '40%',
  },
  summaryBar: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stopList: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  listLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
