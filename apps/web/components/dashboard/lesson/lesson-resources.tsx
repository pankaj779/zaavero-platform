import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import {
  lessonPlayerCopy,
  lessonResourceKindLabel,
  type LessonResourceDto,
} from '../../../lib/dashboard';

const FileIcon = icons.fileText;
const DownloadIcon = icons.download;

export function LessonResources({
  resources,
}: {
  resources: LessonResourceDto[];
}): React.JSX.Element {
  return (
    <section className="space-y-4" aria-labelledby="lesson-resources-heading">
      <h2 id="lesson-resources-heading" className="text-lg font-semibold text-foreground">
        {lessonPlayerCopy.resourcesTitle}
      </h2>

      {resources.length === 0 ? (
        <p className="text-small text-muted-foreground">{lessonPlayerCopy.resourcesEmpty}</p>
      ) : (
        <ul className="grid gap-3 tablet:grid-cols-2">
          {resources.map((resource) => (
            <li key={resource.id}>
              <Card className="h-full rounded-xl shadow-sm">
                <CardHeader className="space-y-3 p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                      <FileIcon className="h-4 w-4 text-foreground" aria-hidden />
                    </span>
                    <Badge variant="neutral">{lessonResourceKindLabel[resource.kind]}</Badge>
                  </div>
                  <CardTitle className="text-sm">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                  {resource.fileName ? (
                    <p className="text-caption text-muted-foreground">{resource.fileName}</p>
                  ) : null}
                  <Button type="button" variant="outline" size="sm" disabled className="w-full">
                    <DownloadIcon className="h-4 w-4" aria-hidden />
                    Download unavailable
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
