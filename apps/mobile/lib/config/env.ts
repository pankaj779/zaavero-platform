import Constants from 'expo-constants';

/**
 * Resolves the base URL of the existing NestJS API.
 *
 * Precedence:
 *  1. EXPO_PUBLIC_API_URL (build/runtime env)
 *  2. app.json -> expo.extra.apiUrl
 *  3. localhost fallback (simulator only)
 *
 * The mobile app never talks to a different backend than web — it reuses the
 * exact same REST API, auth, RBAC, DTOs, and business logic.
 */
function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra) {
    return fromExtra.replace(/\/$/, '');
  }

  return 'http://localhost:3001/api/v1';
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  isProduction: process.env.NODE_ENV === 'production',
};
