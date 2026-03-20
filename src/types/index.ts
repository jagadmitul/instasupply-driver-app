export type DeliveryStatus = 'pending' | 'picked_up' | 'in_transit' | 'delivered';

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  latitude: number;
  longitude: number;
  status: DeliveryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phoneVerified: boolean;
  fcmToken: string | null;
}

export interface RouteStop {
  delivery: Delivery;
  distanceText: string;
  durationText: string;
  distanceValue: number;
  durationValue: number;
}

export interface OptimisedRoute {
  stops: RouteStop[];
  totalDistanceText: string;
  totalDurationText: string;
  polylinePoints: Array<{ latitude: number; longitude: number }>;
}

export type RootStackParamList = {
  Login: undefined;
  OTPVerification: undefined;
  Main: undefined;
  Deliveries: undefined;
  OptimisedRoute: undefined;
};
