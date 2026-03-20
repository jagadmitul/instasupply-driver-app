import { auth, firestore } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Sign in with email and password via Firebase Auth
 */
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  return auth().signInWithEmailAndPassword(email, password);
};

/**
 * Send OTP to the given phone number and return the verification ID
 */
export const sendOTP = async (phoneNumber: string): Promise<string> => {
  const confirmation = await auth().verifyPhoneNumber(phoneNumber);
  return confirmation.verificationId;
};

/**
 * Verify the OTP code and link the phone credential to the current user
 */
export const verifyOTPAndLink = async (
  verificationId: string,
  code: string,
): Promise<void> => {
  const credential = auth.PhoneAuthProvider.credential(verificationId, code);
  const currentUser = auth().currentUser;

  if (!currentUser) {
    throw new Error('No authenticated user found');
  }

  await currentUser.linkWithCredential(credential);

  // Mark phone as verified in Firestore
  await firestore().collection('users').doc(currentUser.uid).set(
    {
      phoneVerified: true,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Check if the current user has verified their phone number
 */
export const isPhoneVerified = async (uid: string): Promise<boolean> => {
  const doc = await firestore().collection('users').doc(uid).get();
  return doc.data()?.phoneVerified === true;
};

/**
 * Create or update user profile in Firestore after login
 */
export const ensureUserProfile = async (
  user: FirebaseAuthTypes.User,
): Promise<void> => {
  const userRef = firestore().collection('users').doc(user.uid);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      uid: user.uid,
      email: user.email,
      name: user.displayName || '',
      phoneVerified: false,
      fcmToken: null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  await auth().signOut();
};
