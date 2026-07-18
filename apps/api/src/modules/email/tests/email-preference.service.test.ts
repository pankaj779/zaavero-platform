/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi } from 'vitest';
import type { EmailRepository } from '../interfaces/email-repository.interface';
import { EmailPreferenceService } from '../services/email-preference.service';

describe('EmailPreferenceService', () => {
  it('does not allow security email to be disabled', async () => {
    const repository = {
      getPreference: vi.fn(),
      upsertPreference: vi.fn(),
    } as unknown as EmailRepository;
    const service = new EmailPreferenceService(repository);

    await expect(service.update('org-1', 'user-1', { security: false })).rejects.toThrow(
      /cannot be disabled/i,
    );
    expect(repository.upsertPreference).not.toHaveBeenCalled();
  });

  it('always enables the SECURITY category', async () => {
    const repository = { getPreference: vi.fn() } as unknown as EmailRepository;
    const service = new EmailPreferenceService(repository);
    await expect(service.isEnabled('org-1', 'user-1', 'SECURITY')).resolves.toBe(true);
    expect(repository.getPreference).not.toHaveBeenCalled();
  });
});
