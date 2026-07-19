import { Injectable } from '@nestjs/common';
import { AISafetyViolationException } from '../exceptions';

const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions/i,
  /disregard (the )?(system|developer) prompt/i,
  /reveal (the )?(system|hidden|secret) prompt/i,
  /you are now (?:in )?developer mode/i,
  /jailbreak/i,
];

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{8,}/,
  /Bearer\s+[a-zA-Z0-9._-]{8,}/i,
  /api[_-]?key\s*[:=]\s*[a-zA-Z0-9._-]{8,}/i,
];

@Injectable()
export class AISafetyService {
  validateUserInput(input: string): void {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new AISafetyViolationException('Message content is required.');
    }
    if (trimmed.length > 8000) {
      throw new AISafetyViolationException('Message exceeds the maximum allowed length.');
    }
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new AISafetyViolationException('The message was blocked by safety checks.');
      }
    }
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(trimmed)) {
        throw new AISafetyViolationException('Secrets must not be included in AI prompts.');
      }
    }
  }

  sanitizeOutput(content: string): string {
    return content
      .replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]')
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [redacted]');
  }
}
