'use client';

import { useState } from 'react';
import { Button } from '@graphology/ui';
import { teacherMessagesPageCopy } from '../../../lib/teacher';

/** Compose shell — send, attach, and emoji stay disabled until messaging lands. */
export function ComposePanel(): React.JSX.Element {
  const copy = teacherMessagesPageCopy;
  const [draft, setDraft] = useState('');

  return (
    <section
      className="space-y-3 border-t border-border pt-4"
      aria-label={copy.composeLabel}
    >
      <label htmlFor="teacher-message-compose" className="sr-only">
        {copy.composeLabel}
      </label>
      <textarea
        id="teacher-message-compose"
        value={draft}
        rows={3}
        placeholder={copy.composePlaceholder}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled aria-label={`${copy.sendButton} — coming soon`}>
          {copy.sendButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${copy.attachButton} — coming soon`}
        >
          {copy.attachButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${copy.emojiButton} — coming soon`}
        >
          {copy.emojiButton}
        </Button>
      </div>
      <p className="text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </section>
  );
}
