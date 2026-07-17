import { Button } from '@graphology/ui';
import { icons } from '../../../../lib/constants';
import { lessonPlayerCopy, type VideoContentDto } from '../../../../lib/dashboard';

const PlayIcon = icons.play;

export function VideoLesson({ content }: { content: VideoContentDto }): React.JSX.Element {
  return (
    <section className="space-y-4" aria-label="Video lesson">
      <div
        className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted via-surface to-muted"
        role="img"
        aria-label={content.posterAlt}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card shadow-sm">
            <PlayIcon className="h-8 w-8 text-foreground" aria-hidden />
          </span>
          <p className="text-sm font-medium text-foreground">{lessonPlayerCopy.videoPlay}</p>
          <p className="text-caption text-muted-foreground">{content.durationLabel}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="absolute bottom-4 right-4"
          disabled
        >
          {lessonPlayerCopy.videoPlay}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">{lessonPlayerCopy.videoTranscript}</h2>
        <p className="mt-2 text-small leading-relaxed text-muted-foreground">
          {content.transcriptPlaceholder}
        </p>
      </div>
    </section>
  );
}
