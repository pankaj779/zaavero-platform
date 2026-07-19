import { Injectable } from '@nestjs/common';
import type { MeetingProviderValue } from '../constants/meeting.constants';
import { InvalidMeetingRequestException } from '../exceptions';
import { GoogleMeetProvider } from './google-meet.provider';
import type { MeetingProvider } from './meeting-provider.interface';
import { SandboxMeetingProvider } from './sandbox-meeting.provider';
import { ZoomMeetingProvider } from './zoom-meeting.provider';

@Injectable()
export class MeetingProviderRegistry {
  private readonly providers: Map<MeetingProviderValue, MeetingProvider>;

  constructor(
    zoom: ZoomMeetingProvider,
    google: GoogleMeetProvider,
    sandbox: SandboxMeetingProvider,
  ) {
    this.providers = new Map<MeetingProviderValue, MeetingProvider>([
      ['ZOOM', zoom],
      ['GOOGLE_MEET', google],
      ['SANDBOX', sandbox],
    ]);
  }

  get(provider: MeetingProviderValue): MeetingProvider {
    const impl = this.providers.get(provider);
    if (!impl) {
      throw new InvalidMeetingRequestException(
        `Meeting provider "${provider}" is not supported for provisioning.`,
      );
    }
    return impl;
  }

  list(): MeetingProvider[] {
    return [...this.providers.values()];
  }
}
