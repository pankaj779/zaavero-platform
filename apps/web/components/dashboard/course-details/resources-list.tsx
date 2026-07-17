import { Card } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { courseDetailsCopy, type CourseResourceDto } from '../../../lib/dashboard';

const FileIcon = icons.fileText;

export function ResourcesList({
  resources,
}: {
  resources: CourseResourceDto[];
}): React.JSX.Element {
  if (resources.length === 0) {
    return <p className="text-small text-muted-foreground">{courseDetailsCopy.resourcesEmpty}</p>;
  }

  return (
    <ul className="space-y-3" aria-label="Course resources">
      {resources.map((resource) => (
        <li key={resource.id}>
          <Card className="flex items-start gap-3 rounded-xl p-4 shadow-sm">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileIcon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">{resource.title}</p>
              <p className="text-small text-muted-foreground">{resource.description}</p>
              <p className="text-caption text-muted-foreground">{resource.fileName}</p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
