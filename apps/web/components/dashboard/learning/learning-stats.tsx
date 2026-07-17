import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
} from '@graphology/ui';
import {
  continueLearningItem,
  formatLastAccessedLabel,
  learningPageCopy,
  learningStats,
  recentlyAccessedItems,
} from '../../../lib/dashboard';
import { DashboardWidget } from '../widgets/dashboard-widget';

export function LearningStats(): React.JSX.Element {
  return (
    <section className="space-y-4" aria-label="Learning summary">
      <div className="grid gap-4 tablet:grid-cols-2 laptop:grid-cols-3">
        <DashboardWidget
          title={learningPageCopy.continueLearningTitle}
          description="Pick up your next lesson."
          state="populated"
          emptyTitle={learningPageCopy.noContinueTitle}
          emptyDescription={learningPageCopy.noContinueDescription}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {continueLearningItem.course.title}
              </p>
              <p className="text-small text-muted-foreground">
                {continueLearningItem.nextLesson.title}
              </p>
            </div>
            <ProgressBar
              value={continueLearningItem.progress.percentage}
              label="Continue progress"
            />
          </div>
        </DashboardWidget>

        <DashboardWidget
          title={learningPageCopy.recentlyAccessedTitle}
          description="Courses you opened recently."
          state="populated"
          emptyTitle={learningPageCopy.noRecentTitle}
          emptyDescription={learningPageCopy.noRecentDescription}
        >
          <ul className="space-y-2">
            {recentlyAccessedItems.map((item) => (
              <li
                key={item.course.id}
                className="rounded-lg border border-border bg-surface px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground">{item.course.title}</p>
                <p className="text-caption text-muted-foreground">
                  {formatLastAccessedLabel(item.accessedAt)}
                </p>
              </li>
            ))}
          </ul>
        </DashboardWidget>

        {learningStats.map((stat) => (
          <Card key={stat.id} className="rounded-xl shadow-sm">
            <CardHeader className="space-y-2 p-5 pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl tracking-tight">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-caption text-muted-foreground">{stat.helper}</p>
              {stat.value === '—' ? (
                <Badge variant="neutral" className="mt-3">
                  Placeholder
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
