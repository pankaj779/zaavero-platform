'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Textarea } from '@graphology/ui';
import { lessonPlayerCopy, type LessonNotesDto } from '../../../lib/dashboard';

export function LessonNotes({ notes }: { notes: LessonNotesDto }): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{lessonPlayerCopy.notesTitle}</CardTitle>
        <CardDescription>{lessonPlayerCopy.notesHelper}</CardDescription>
      </CardHeader>
      <CardContent>
        <label className="sr-only" htmlFor="lesson-notes-editor">
          {lessonPlayerCopy.notesTitle}
        </label>
        <Textarea
          id="lesson-notes-editor"
          defaultValue={notes.content ?? ''}
          placeholder={lessonPlayerCopy.notesPlaceholder}
          rows={5}
          className="min-h-[8rem] resize-y"
        />
      </CardContent>
    </Card>
  );
}
