import { useState, useEffect } from 'react';
import { auth, firestore } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  phoneVerified: boolean;
  loading: boolean;
}

/**
 * Hook to manage Firebase authentication state.
 * Uses real-time Firestore listener for phoneVerified so navigation
 * updates immediately when OTP verification completes.
 */
export const useAuth = (): AuthState => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setPhoneVerified(false);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  // Real-time listener on user's Firestore doc for phoneVerified
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribeDoc = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(
        (doc) => {
          setPhoneVerified(doc.data()?.phoneVerified === true);
          setLoading(false);
        },
        () => {
          // Doc might not exist yet — that's fine
          setPhoneVerified(false);
          setLoading(false);
        },
      );

    return unsubscribeDoc;
  }, [user?.uid]);

  return { user, phoneVerified, loading };
};
