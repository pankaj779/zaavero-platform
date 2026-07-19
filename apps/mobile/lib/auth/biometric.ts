import * as LocalAuthentication from 'expo-local-authentication';
import { tokenStorage } from './token-storage';

export const biometric = {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    return LocalAuthentication.isEnrolledAsync();
  },

  async isEnabled(): Promise<boolean> {
    if (!(await this.isAvailable())) return false;
    return tokenStorage.isBiometricEnabled();
  },

  async enable(): Promise<boolean> {
    const ok = await this.authenticate('Enable biometric unlock');
    if (ok) await tokenStorage.setBiometricEnabled(true);
    return ok;
  },

  async disable(): Promise<void> {
    await tokenStorage.setBiometricEnabled(false);
  },

  async authenticate(promptMessage = 'Unlock Graphology'): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });
    return result.success;
  },
};
