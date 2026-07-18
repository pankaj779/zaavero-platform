/**
 * Shared coming-soon copy for Teacher Portal UI consistency.
 * Module-specific footnotes may still explain *why* an action is blocked.
 */
export const TEACHER_COMING_SOON = {
  /** Appended to disabled control aria-labels: `${action} — ${ariaSuffix}` */
  ariaSuffix: 'coming soon',
  /** Label shown next to disabled integration rows / badges */
  integrationLabel: 'Coming Soon',
  /** Default footnote when a module does not define a more specific note */
  note: 'Backend integration coming soon.',
} as const;
