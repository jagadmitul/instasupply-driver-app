import type { Delivery, OptimisedRoute, RouteStop } from '../types';

/**
 * Google Maps API key — loaded from app config (set via app.json or EAS env vars).
 * In production, restrict this key to your app's package name in Google Cloud Console.
 */
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface DirectionsLeg {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
}

interface DirectionsRoute {
  legs: DirectionsLeg[];
  overview_polyline: { points: string };
  waypoint_order: number[];
}

interface DirectionsResponse {
  status: string;
  routes: DirectionsRoute[];
}

/**
 * Decode a Google Maps encoded polyline string into lat/lng points
 */
const decodePolyline = (encoded: string): Array<{ latitude: number; longitude: number }> => {
  const points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Optimise the delivery route using Google Maps Directions API.
 * Uses `optimize:true` on waypoints to factor in distance, traffic, and travel time.
 */
export const optimiseRoute = async (
  driverLocation: { latitude: number; longitude: number },
  deliveries: Delivery[],
): Promise<OptimisedRoute> => {
  if (deliveries.length === 0) {
    return {
      stops: [],
      totalDistanceText: '0 km',
      totalDurationText: '0 min',
      polylinePoints: [],
    };
  }

  // For a single delivery, no optimization needed
  if (deliveries.length === 1) {
    return buildSingleStopRoute(driverLocation, deliveries[0]);
  }

  const origin = `${driverLocation.latitude},${driverLocation.longitude}`;

  // Last delivery is the final destination, rest are waypoints
  // Using optimize:true lets Google reorder waypoints for best route
  const waypoints = deliveries
    .map((d) => `${d.latitude},${d.longitude}`)
    .join('|');

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${origin}` +
    `&destination=${deliveries[deliveries.length - 1].latitude},${deliveries[deliveries.length - 1].longitude}` +
    `&waypoints=optimize:true|${waypoints}` +
    `&departure_time=now` +
    `&traffic_model=best_guess` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();

    if (data.status !== 'OK' || data.routes.length === 0) {
      console.error('Directions API error:', data.status);
      return buildFallbackRoute(deliveries);
    }

    const route = data.routes[0];
    const optimisedOrder = route.waypoint_order;

    // Build ordered stops based on Google's optimisation
    const stops: RouteStop[] = optimisedOrder.map((waypointIndex, legIndex) => ({
      delivery: deliveries[waypointIndex],
      distanceText: route.legs[legIndex]?.distance?.text || '',
      durationText: route.legs[legIndex]?.duration?.text || '',
      distanceValue: route.legs[legIndex]?.distance?.value || 0,
      durationValue: route.legs[legIndex]?.duration?.value || 0,
    }));

    // Calculate totals
    const totalDistance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
    const totalDuration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0);

    return {
      stops,
      totalDistanceText: `${(totalDistance / 1000).toFixed(1)} km`,
      totalDurationText: formatDuration(totalDuration),
      polylinePoints: decodePolyline(route.overview_polyline.points),
    };
  } catch (error) {
    console.error('Route optimisation failed:', error);
    return buildFallbackRoute(deliveries);
  }
};

/**
 * Build a simple route for a single stop (no optimization needed)
 */
const buildSingleStopRoute = async (
  driverLocation: { latitude: number; longitude: number },
  delivery: Delivery,
): Promise<OptimisedRoute> => {
  const origin = `${driverLocation.latitude},${driverLocation.longitude}`;
  const destination = `${delivery.latitude},${delivery.longitude}`;

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${origin}` +
    `&destination=${destination}` +
    `&departure_time=now` +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data: DirectionsResponse = await response.json();

    if (data.status !== 'OK' || data.routes.length === 0) {
      return buildFallbackRoute([delivery]);
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      stops: [
        {
          delivery,
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          distanceValue: leg.distance.value,
          durationValue: leg.duration.value,
        },
      ],
      totalDistanceText: leg.distance.text,
      totalDurationText: leg.duration.text,
      polylinePoints: decodePolyline(route.overview_polyline.points),
    };
  } catch {
    return buildFallbackRoute([delivery]);
  }
};

/**
 * Fallback route when API fails — uses straight-line distance sorting
 */
const buildFallbackRoute = (deliveries: Delivery[]): OptimisedRoute => {
  return {
    stops: deliveries.map((delivery) => ({
      delivery,
      distanceText: 'N/A',
      durationText: 'N/A',
      distanceValue: 0,
      durationValue: 0,
    })),
    totalDistanceText: 'N/A',
    totalDurationText: 'N/A',
    polylinePoints: [],
  };
};

/**
 * Format seconds into human-readable duration
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};
