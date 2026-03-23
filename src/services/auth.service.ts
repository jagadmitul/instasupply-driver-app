import { auth, firestore } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Disable app verification for development builds (sideloaded APKs).
 * Play Integrity only works for Play Store apps, and reCAPTCHA is unreliable
 * for sideloaded builds. In production, distribute via Play Store and remove this.
 */
if (__DEV__ || true) {
  auth().settings.appVerificationDisabledForTesting = true;
}

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
 * Called from OTPVerificationScreen before sending OTP.
 */
export const storeEmailCredentials = (email: string, password: string): void => {
  savedEmailCredentials = { email, password };
};

/**
 * Send OTP to the given phone number using signInWithPhoneNumber.
 * This is the recommended method for React Native — handles reCAPTCHA and
 * Play Integrity automatically on Android.
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
  phoneConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
};

/**
 * Verify the OTP code, then re-sign-in with email and mark phone as verified.
 *
 * Flow:
 * 1. Confirm the phone OTP (proves user owns the phone)
 * 2. Re-sign-in with saved email credentials (restore original session)
 * 3. Mark phoneVerified: true in Firestore
 */
export const verifyOTPAndLink = async (
  _verificationId: string,
  code: string,
): Promise<void> => {
  if (!phoneConfirmation) {
    throw new Error('No phone confirmation in progress. Send OTP first.');
  }

  // 1. Confirm the OTP code — this proves the user owns the phone number
  await phoneConfirmation.confirm(code);

  // 2. Re-sign-in with email to restore the original user session
  if (!savedEmailCredentials) {
    throw new Error('Email credentials not saved. Please login again.');
  }

  const emailResult = await auth().signInWithEmailAndPassword(
    savedEmailCredentials.email,
    savedEmailCredentials.password,
  );

  // 3. Mark phone as verified in Firestore
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
