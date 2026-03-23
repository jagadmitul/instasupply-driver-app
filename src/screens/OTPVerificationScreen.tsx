import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { sendOTP, verifyOTPAndLink } from '../services/auth.service';

/**
 * OTP verification screen — prompts for phone number, sends OTP, and verifies
 */
export const OTPVerificationScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    const cleaned = phoneNumber.trim().replace(/\D/g, '');
    if (!cleaned) {
      Alert.alert('Error', 'Please enter your mobile number');
      return;
    }

    if (cleaned.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    const formatted = `+91${cleaned}`;

    setLoading(true);
    try {
      const vId = await sendOTP(formatted);
      setVerificationId(vId);
      Alert.alert('OTP Sent', `A verification code has been sent to ${formatted}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to send OTP';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const trimmedCode = otpCode.trim();
    if (!verificationId || !trimmedCode) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }
    if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      Alert.alert('Error', 'OTP must be exactly 6 digits');
      return;
    }

    setLoading(true);
    try {
      await verifyOTPAndLink(verificationId, otpCode.trim());
      // Navigation will handle redirect via useAuth hook detecting phoneVerified change
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'OTP verification failed';
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.description}>
          We need to verify your mobile number before you can access the app.
        </Text>

        {!verificationId ? (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/[^0-9]/g, '');
                setPhoneNumber(digitsOnly.slice(0, 10));
              }}
              placeholder="9876543210"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={10}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP Code</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="123456"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setVerificationId(null);
                setOtpCode('');
              }}
            >
              <Text style={styles.resendText}>Change number / Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 24,
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    color: '#1E3A5F',
    fontSize: 14,
    fontWeight: '500',
  },
});
