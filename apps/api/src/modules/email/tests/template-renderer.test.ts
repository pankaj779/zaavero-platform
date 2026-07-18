import { describe, expect, it } from 'vitest';
import { renderTemplate, validateTemplateVariables } from '../templates/template-renderer';

describe('email template renderer', () => {
  it('HTML-escapes substituted variables', () => {
    expect(renderTemplate('<p>{{name}}</p>', { name: '<script>x</script>' }, true)).toBe(
      '<p>&lt;script&gt;x&lt;/script&gt;</p>',
    );
  });

  it('validates required variables', () => {
    expect(() => {
      validateTemplateVariables(
        { required: ['name'], properties: { name: { type: 'string' } } },
        {},
      );
    }).toThrow(/name/);
  });
});
