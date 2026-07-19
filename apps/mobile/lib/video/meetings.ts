import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LiveSessionsApi, type LiveSessionRecord } from '../api/endpoints';

/**
 * Video meetings reuse the existing live-session backend (Zoom / Google Meet /
 * Sandbox). Start/End transitions are performed via the shared endpoints and the
 * returned join URL is opened in the native app (deep link) or a secure browser.
 */
export const meetings = {
  get(id: string): Promise<LiveSessionRecord> {
    return LiveSessionsApi.get(id);
  },

  start(id: string): Promise<LiveSessionRecord> {
    return LiveSessionsApi.start(id);
  },

  end(id: string): Promise<LiveSessionRecord> {
    return LiveSessionsApi.end(id);
  },

  async join(session: LiveSessionRecord): Promise<boolean> {
    const url = session.meetingUrl;
    if (!url) return false;

    // Prefer the provider's native app via deep link, fall back to a browser.
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    await WebBrowser.openBrowserAsync(url);
    return true;
  },
};
