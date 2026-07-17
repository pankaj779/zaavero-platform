'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from '@graphology/ui';
import { lessonPlayerCopy, type ExerciseContentDto } from '../../../../lib/dashboard';

export function ExerciseLesson({ content }: { content: ExerciseContentDto }): React.JSX.Element {
  return (
    <section className="space-y-4" aria-label="Exercise lesson">
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{lessonPlayerCopy.exerciseInstructions}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-small leading-relaxed text-muted-foreground">{content.instructions}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{lessonPlayerCopy.exerciseQuestion}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground">{content.questionPlaceholder}</p>
          <label className="sr-only" htmlFor="exercise-answer">
            Answer
          </label>
          <Textarea
            id="exercise-answer"
            placeholder="Answer placeholder"
            rows={4}
            disabled
            className="resize-y"
          />
          <Button type="button" variant="primary" size="md" disabled>
            {lessonPlayerCopy.exerciseSubmit}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
