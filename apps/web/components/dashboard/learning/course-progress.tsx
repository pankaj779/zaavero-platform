import { ProgressBar } from '@graphology/ui';

export function CourseProgress({
  value,
  lessonsCompleted,
  totalLessons,
  lessonsLabel,
}: {
  value: number;
  lessonsCompleted: number;
  totalLessons: number;
  lessonsLabel: string;
}): React.JSX.Element {
  return (
    <div className="space-y-2">
      <ProgressBar value={value} label="Course progress" />
      <p className="text-caption text-muted-foreground">
        {lessonsLabel}: {lessonsCompleted}/{totalLessons}
      </p>
    </div>
  );
}
