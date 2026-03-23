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

/** Stored confirmation result from signInWithPhoneNumber */
let phoneConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

/** Stored email credentials to re-sign-in after phone verification */
let savedEmailCredentials: { email: string; password: string } | null = null;

/**
 * Store the email credentials so we can re-sign-in after phone verification.
 */
export const storeEmailCredentials = (email: string, password: string): void => {
  savedEmailCredentials = { email, password };
};

/**
 * Send OTP via signInWithPhoneNumber — triggers reCAPTCHA on sideloaded APKs
 * (brief browser redirect, standard Firebase behavior), then sends real SMS.
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
  phoneConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
};

/**
 * Verify OTP, then restore email session and mark phone as verified.
 */
export const verifyOTPAndLink = async (
  _verificationId: string,
  code: string,
): Promise<void> => {
  if (!phoneConfirmation) {
    throw new Error('No phone confirmation in progress. Send OTP first.');
  }

  // Confirm the OTP
  await phoneConfirmation.confirm(code);

  // Re-sign-in with email to restore original session
  if (!savedEmailCredentials) {
    throw new Error('Email credentials not saved. Please login again.');
  }

  const emailResult = await auth().signInWithEmailAndPassword(
    savedEmailCredentials.email,
    savedEmailCredentials.password,
  );

  // Mark phone as verified in Firestore
  await firestore().collection('users').doc(emailResult.user.uid).set(
    {
      phoneVerified: true,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Cleanup
  phoneConfirmation = null;
  savedEmailCredentials = null;
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
  phoneConfirmation = null;
  savedEmailCredentials = null;
  await auth().signOut();
};
