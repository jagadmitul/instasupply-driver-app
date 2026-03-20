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
 * Tracks both auth state and phone verification status from Firestore.
 */
export const useAuth = (): AuthState => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Check phone verification status from Firestore
        const doc = await firestore()
          .collection('users')
          .doc(firebaseUser.uid)
          .get();

        setPhoneVerified(doc.data()?.phoneVerified === true);
      } else {
        setPhoneVerified(false);
      }

      setLoading(false);
    });

    return unsubscribeAuth;
  }, []);

  return { user, phoneVerified, loading };
};
