import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@graphology/ui';
import {
  formatLiveDate,
  formatLiveTimeRange,
  livePageCopy,
  liveStatusLabel,
  type LiveClassDto,
} from '../../../lib/dashboard';

export function UpcomingClassCard({ liveClass }: { liveClass: LiveClassDto }): React.JSX.Element {
  return (
    <Card className="flex h-full flex-col rounded-xl shadow-sm">
      <CardHeader className="space-y-3">
        <Badge variant="neutral" className="w-fit">
          {liveStatusLabel[liveClass.status]}
        </Badge>
        <CardTitle className="text-base leading-snug">{liveClass.title}</CardTitle>
        <CardDescription>{liveClass.course.title}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-2 text-small text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{livePageCopy.mentorLabel}: </span>
          {liveClass.mentor.name}
        </p>
        <p>
          <span className="font-medium text-foreground">{livePageCopy.dateLabel}: </span>
          {formatLiveDate(liveClass.startTime)}
        </p>
        <p>
          <span className="font-medium text-foreground">{livePageCopy.timeLabel}: </span>
          {formatLiveTimeRange(liveClass.startTime, liveClass.endTime)}
        </p>
        <p>
          <span className="font-medium text-foreground">{livePageCopy.durationLabel}: </span>
          {liveClass.duration.label}
        </p>
      </CardContent>

      <CardFooter>
        <Button type="button" variant="outline" size="md" className="w-full" disabled>
          {livePageCopy.viewDetails}
        </Button>
      </CardFooter>
    </Card>
  );
}
