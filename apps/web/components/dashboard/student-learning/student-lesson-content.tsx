'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import type { StudentLessonPlayerDto } from '../../../lib/student';
import { studentLessonPlayerCopy } from './copy';
import { formatDurationSeconds } from './learning-helpers';

function ContentShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="space-y-4" aria-label={label}>
      {children}
    </section>
  );
}

function UnavailableContent({ label }: { label: string }): React.JSX.Element {
  return (
    <ContentShell label={label}>
      <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center">
        <p className="max-w-md text-small text-muted-foreground">
          {studentLessonPlayerCopy.contentUnavailable}
        </p>
      </div>
    </ContentShell>
  );
}

export function StudentLessonContent({
  player,
}: {
  player: StudentLessonPlayerDto;
}): React.JSX.Element {
  const { lesson, capabilities } = player;
  const url = lesson.contentUrl;
  const duration = formatDurationSeconds(lesson.durationSeconds);

  switch (lesson.contentType) {
    case 'video': {
      if (!url || capabilities.videoStreaming === 'disabled') {
        return <UnavailableContent label={studentLessonPlayerCopy.videoLabel} />;
      }
      return (
        <ContentShell label={studentLessonPlayerCopy.videoLabel}>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <video className="aspect-video w-full bg-black" controls preload="metadata" src={url}>
              <track kind="captions" />
            </video>
          </div>
          {duration ? <p className="text-caption text-muted-foreground">{duration}</p> : null}
          {lesson.description ? (
            <p className="text-small leading-relaxed text-muted-foreground">{lesson.description}</p>
          ) : null}
        </ContentShell>
      );
    }
    case 'pdf': {
      if (!url || capabilities.pdfViewer === 'disabled') {
        return <UnavailableContent label={studentLessonPlayerCopy.pdfLabel} />;
      }
      return (
        <ContentShell label={studentLessonPlayerCopy.pdfLabel}>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <iframe title={lesson.title} src={url} className="min-h-[28rem] w-full" />
          </div>
          <Button variant="outline" size="md" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              {studentLessonPlayerCopy.openContent}
            </a>
          </Button>
        </ContentShell>
      );
    }
    case 'reading': {
      return (
        <ContentShell label={studentLessonPlayerCopy.readingLabel}>
          <article className="mx-auto max-w-3xl space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{lesson.title}</h2>
            {lesson.description ? (
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                {lesson.description}
              </p>
            ) : (
              <p className="text-small text-muted-foreground">
                {studentLessonPlayerCopy.contentUnavailable}
              </p>
            )}
            {url ? (
              <Button variant="outline" size="md" asChild>
                <a href={url} target="_blank" rel="noreferrer">
                  {studentLessonPlayerCopy.openContent}
                </a>
              </Button>
            ) : null}
          </article>
        </ContentShell>
      );
    }
    case 'exercise': {
      return (
        <ContentShell label={studentLessonPlayerCopy.exerciseLabel}>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{lesson.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lesson.description ? (
                <p className="whitespace-pre-wrap text-small leading-relaxed text-muted-foreground">
                  {lesson.description}
                </p>
              ) : (
                <p className="text-small text-muted-foreground">
                  {studentLessonPlayerCopy.contentUnavailable}
                </p>
              )}
              {url ? (
                <Button variant="outline" size="md" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    {studentLessonPlayerCopy.openContent}
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </ContentShell>
      );
    }
    default: {
      return (
        <ContentShell label={studentLessonPlayerCopy.otherLabel}>
          <Card className="rounded-xl shadow-sm">
            <CardContent className="space-y-3 p-6">
              <p className="text-sm font-medium text-foreground">{lesson.title}</p>
              {lesson.description ? (
                <p className="text-small text-muted-foreground">{lesson.description}</p>
              ) : (
                <p className="text-small text-muted-foreground">
                  {studentLessonPlayerCopy.contentUnavailable}
                </p>
              )}
              {url ? (
                <Button variant="outline" size="md" asChild>
                  <a href={url} target="_blank" rel="noreferrer">
                    {studentLessonPlayerCopy.openContent}
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </ContentShell>
      );
    }
  }
}
