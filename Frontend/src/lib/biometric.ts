import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

/**
 * Utility for handling Face/Fingerprint authentication in the mobile app.
 */
export const biometricAuth = {
  /**
   * Checks if the device supports biometric auth and returns the type.
   */
  async checkAvailability(): Promise<{ isAvailable: boolean; type: BiometryType | 'NONE' }> {
    try {
      const result = await NativeBiometric.isAvailable();
      return {
        isAvailable: !!result.isAvailable,
        type: result.biometryType as BiometryType || 'NONE'
      };
    } catch (error) {
      console.warn('Biometrics not available:', error);
      return { isAvailable: false, type: 'NONE' };
    }
  },

  /**
   * Prompts the user for biometric authentication.
   */
  async authenticate(): Promise<boolean> {
    try {
      await NativeBiometric.verifyIdentity({
        reason: 'Authenticate to access Mehar Finance',
        title: 'Biometric Login',
        subtitle: 'Use Face or Fingerprint',
        description: 'Verify your identity to continue',
        useFallback: true,
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  },

  /**
   * Saves credentials for future biometric login.
   * Note: This is an optional feature to actually 'log in' using biometrics.
   */
  async setCredentials(email: string, password: string): Promise<void> {
    try {
      await NativeBiometric.setCredentials({
        username: email,
        password: password,
        server: 'mehar-finance-auth',
      });
    } catch (error) {
      console.error('Failed to save biometric credentials:', error);
    }
  },

  /**
   * Retrieves saved credentials for biometric login.
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      const credentials = await NativeBiometric.getCredentials({
        server: 'mehar-finance-auth',
      });
      return credentials;
    } catch (error) {
      console.error('Failed to retrieve biometric credentials:', error);
      return null;
    }
  }
};
