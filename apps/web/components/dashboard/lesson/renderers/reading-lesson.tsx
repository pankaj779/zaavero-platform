import { lessonPlayerCopy, type ReadingBlockDto, type ReadingContentDto } from '../../../../lib/dashboard';

function ReadingBlock({ block }: { block: ReadingBlockDto }): React.JSX.Element | null {
  switch (block.type) {
    case 'heading':
      if (block.level === 3) {
        return <h3 className="mt-8 text-lg font-semibold text-foreground">{block.text}</h3>;
      }
      return <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">{block.text}</h2>;
    case 'paragraph':
      return <p className="text-base leading-relaxed text-foreground/90">{block.text}</p>;
    case 'callout':
      return (
        <aside
          className="rounded-lg border border-border bg-muted/60 px-4 py-3 text-small leading-relaxed text-foreground"
          aria-label="Callout"
        >
          {block.text}
        </aside>
      );
    case 'quote':
      return (
        <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
          <p>{block.text}</p>
          {block.attribution ? (
            <footer className="mt-2 text-caption not-italic">— {block.attribution}</footer>
          ) : null}
        </blockquote>
      );
    case 'image':
      return (
        <div
          className="flex aspect-[16/9] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-caption text-muted-foreground"
          role="img"
          aria-label={block.imageAlt ?? 'Image placeholder'}
        >
          {block.imageAlt ?? 'Image placeholder'}
        </div>
      );
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 text-caption text-foreground">
          <code>{block.code}</code>
        </pre>
      );
    default:
      return null;
  }
}

export function ReadingLesson({ content }: { content: ReadingContentDto }): React.JSX.Element {
  return (
    <article className="space-y-5" aria-label="Reading lesson">
      <p className="text-caption text-muted-foreground">
        {lessonPlayerCopy.readingTime}: {content.estimatedReadingMinutes} min
      </p>
      <div className="mx-auto max-w-3xl space-y-5">
        {content.blocks.map((block) => (
          <ReadingBlock key={block.id} block={block} />
        ))}
      </div>
    </article>
  );
}
