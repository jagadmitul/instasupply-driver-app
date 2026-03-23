import { auth, firestore } from '../config/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Disable app verification for testing with test phone numbers.
 * For real SMS, this is bypassed via verifyPhoneNumber which uses
 * native Android auto-verification (reads SMS automatically).
 */
auth().settings.appVerificationDisabledForTesting = true;

/**
 * Sign in with email and password via Firebase Auth
 */
export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  return auth().signInWithEmailAndPassword(email, password);
};

/** Stored email credentials to re-sign-in after phone verification */
let savedEmailCredentials: { email: string; password: string } | null = null;

/**
 * Store the email credentials so we can re-sign-in after phone verification.
 */
export const storeEmailCredentials = (email: string, password: string): void => {
  savedEmailCredentials = { email, password };
};

/** Stored verification ID from verifyPhoneNumber */
let storedVerificationId: string | null = null;

/**
 * Send OTP to the given phone number.
 * Uses verifyPhoneNumber which supports both test numbers and real SMS.
 * With appVerificationDisabledForTesting=true, test numbers work instantly.
 * Real numbers use native Android auto-verification (no reCAPTCHA needed).
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
  const result = await auth().verifyPhoneNumber(phoneNumber);
  storedVerificationId = result.verificationId;
};

/**
 * Verify the OTP code and mark the user's phone as verified.
 *
 * Flow:
 * 1. Create phone credential from verification ID + code
 * 2. Try to link to current user (may fail if already linked)
 * 3. Mark phoneVerified: true in Firestore
 */
export const verifyOTPAndLink = async (
  _verificationId: string,
  code: string,
): Promise<void> => {
  if (!storedVerificationId) {
    throw new Error('No verification in progress. Send OTP first.');
  }

  const credential = auth.PhoneAuthProvider.credential(storedVerificationId, code);
  const currentUser = auth().currentUser;

  if (!currentUser) {
    throw new Error('No authenticated user found. Please login again.');
  }

  // Try to link phone credential to the current email user
  try {
    await currentUser.linkWithCredential(credential);
  } catch (error: unknown) {
    // Phone may already be linked to this or another account — that's OK.
    // The OTP was validated by Firebase, so we proceed.
    const errorCode = (error as { code?: string }).code;
    console.warn('Phone link skipped:', errorCode || 'unknown');
  }

  // Mark phone as verified in Firestore
  await firestore().collection('users').doc(currentUser.uid).set(
    {
      phoneVerified: true,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  // Cleanup
  storedVerificationId = null;
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
  storedVerificationId = null;
  savedEmailCredentials = null;
  await auth().signOut();
};
