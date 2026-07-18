import { BadRequestException } from '@nestjs/common';

export function escapeHtml(value: unknown): string {
  return scalarString(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function scalarString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return value.toString();
  }
  return '';
}

export function renderTemplate(
  source: string,
  variables: Record<string, unknown>,
  html = false,
): string {
  return source.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null
      ? ''
      : html
        ? escapeHtml(value)
        : scalarString(value);
  });
}

interface VariableSchema {
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, { type?: string; format?: string }>;
}

export function validateTemplateVariables(
  schemaValue: unknown,
  variables: Record<string, unknown>,
): void {
  const schema = (schemaValue ?? {}) as VariableSchema;
  for (const key of schema.required ?? []) {
    if (variables[key] === undefined || variables[key] === null || variables[key] === '') {
      throw new BadRequestException(`Missing required email template variable: ${key}.`);
    }
  }
  if (schema.additionalProperties === false && schema.properties) {
    for (const key of Object.keys(variables)) {
      if (!(key in schema.properties)) {
        throw new BadRequestException(`Unknown email template variable: ${key}.`);
      }
    }
  }
  for (const [key, definition] of Object.entries(schema.properties ?? {})) {
    const value = variables[key];
    if (value === undefined || value === null || !definition.type) continue;
    if (definition.type === 'string' && typeof value !== 'string') {
      throw new BadRequestException(`Email template variable ${key} must be a string.`);
    }
    if (definition.format === 'uri') {
      try {
        const url = new URL(scalarString(value));
        if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
      } catch {
        throw new BadRequestException(`Email template variable ${key} must be a valid URL.`);
      }
    }
  }
}

export function applyEmailLayout(content: string, title: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(
    title,
  )}</title></head><body><main>${content}</main></body></html>`;
}
