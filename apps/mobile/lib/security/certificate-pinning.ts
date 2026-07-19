/**
 * Certificate pinning readiness.
 *
 * The mobile app is structured so a native SSL pin can be introduced without
 * touching the API client surface:
 *
 *  1. Prefer a native networking stack (e.g. `react-native-ssl-pinning` or
 *     Expo config-plugin + OkHttp/NSURLSession pins) for production builds.
 *  2. Keep `apiFetch` / `authApi` / `streamAIChat` as the only HTTP entry points
 *     so the pin layer wraps a single fetch implementation.
 *  3. Never embed secrets or private keys in the JS bundle.
 *
 * Development uses the platform `fetch` (no pin). Production builds should swap
 * `secureFetch` below via a config flag once pins are provisioned.
 */

import { env } from '../config/env';

export type SecureFetch = typeof fetch;

/**
 * Returns the HTTP implementation used by the API layer. Today this is the
 * platform fetch; when pins are configured, replace the body with a pinned
 * native fetch without changing call sites.
 */
export function getSecureFetch(): SecureFetch {
  // Certificate pinning is intentionally not enabled in the JS layer yet —
  // pins must be delivered through a native module / config plugin so they
  // cannot be trivially bypassed by patching the JS bundle.
  void env.isProduction;
  return fetch;
}

export const CERTIFICATE_PINNING_READY = true;
