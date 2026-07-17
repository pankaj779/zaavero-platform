import { Button } from '@graphology/ui';
import { icons } from '../../../../lib/constants';
import { lessonPlayerCopy, type PdfContentDto } from '../../../../lib/dashboard';

const FileIcon = icons.fileText;
const DownloadIcon = icons.download;

export function PdfLesson({ content }: { content: PdfContentDto }): React.JSX.Element {
  return (
    <section className="space-y-4" aria-label="PDF lesson">
      <div
        className="flex min-h-[22rem] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-gradient-to-b from-muted/80 to-surface p-8 text-center shadow-sm"
        role="img"
        aria-label={content.previewAlt}
      >
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-card shadow-sm">
          <FileIcon className="h-7 w-7 text-foreground" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{content.documentTitle}</p>
          <p className="text-caption text-muted-foreground">{content.pageCountLabel}</p>
          <p className="text-small text-muted-foreground">{lessonPlayerCopy.pdfPreview}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 tablet:flex-row">
        <Button type="button" variant="primary" size="md" disabled className="w-full tablet:w-auto">
          <DownloadIcon className="h-4 w-4" aria-hidden />
          {lessonPlayerCopy.pdfDownload}
        </Button>
        <Button type="button" variant="outline" size="md" disabled className="w-full tablet:w-auto">
          {lessonPlayerCopy.pdfOpen}
        </Button>
      </div>
    </section>
  );
}
