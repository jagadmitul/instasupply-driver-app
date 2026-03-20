import React, { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import {
  getInitialNotification,
  onNotificationOpenedApp,
} from '../services/notification.service';
import { LoginScreen } from '../screens/LoginScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { DeliveriesScreen } from '../screens/DeliveriesScreen';
import { OptimisedRouteScreen } from '../screens/OptimisedRouteScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Handles deep linking from notification taps
 */
const NotificationHandler: React.FC = () => {
  const navigation = useNavigation<any>();

  useEffect(() => {
    // Handle notification that opened app from killed state
    getInitialNotification().then((remoteMessage) => {
      if (remoteMessage?.data?.screen === 'Deliveries') {
        navigation.navigate('Deliveries');
      }
    });

    // Handle notification tap when app is in background
    const unsubscribe = onNotificationOpenedApp((data) => {
      if (data?.screen === 'Deliveries') {
        navigation.navigate('Deliveries');
      }
    });

    return unsubscribe;
  }, [navigation]);

  return null;
};

/**
 * Root navigator — gates screens based on auth state and phone verification
 */
export const AppNavigator: React.FC = () => {
  const { user, phoneVerified, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Not authenticated
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !phoneVerified ? (
          // Authenticated but phone not verified
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        ) : (
          // Fully authenticated
          <>
            <Stack.Screen name="Deliveries" component={DeliveriesScreen} />
            <Stack.Screen
              name="OptimisedRoute"
              component={OptimisedRouteScreen}
              options={{
                headerShown: true,
                title: 'Optimised Route',
                headerStyle: { backgroundColor: '#1E3A5F' },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
          </>
        )}
      </Stack.Navigator>
      {user && phoneVerified && <NotificationHandler />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
