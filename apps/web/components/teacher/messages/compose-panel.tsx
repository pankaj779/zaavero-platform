'use client';

import { useState } from 'react';
import { Button } from '@graphology/ui';
import { teacherMessagesPageCopy } from '../../../lib/teacher';

export function ComposePanel({
  onSend,
  pageCopy,
}: {
  onSend: (body: string) => Promise<void>;
  pageCopy?: Partial<typeof teacherMessagesPageCopy>;
}): React.JSX.Element {
  const copy = { ...teacherMessagesPageCopy, ...pageCopy };
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      className="space-y-3 border-t border-border pt-4"
      aria-label={copy.composeLabel}
      onSubmit={(event) => {
        event.preventDefault();
        const body = draft.trim();
        if (body.length === 0 || sending) {
          return;
        }
        setSending(true);
        setError('');
        void onSend(body)
          .then(() => {
            setDraft('');
          })
          .catch(() => {
            setError('Unable to send this message. Please try again.');
          })
          .finally(() => {
            setSending(false);
          });
      }}
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
        disabled={sending}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={sending || draft.trim().length === 0}>
          {sending ? 'Sending…' : copy.sendButton}
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
      {error.length > 0 ? (
        <p className="text-caption text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="text-caption text-muted-foreground">
        Attachments and emoji require storage and rich-message backend support.
      </p>
    </form>
  );
}
