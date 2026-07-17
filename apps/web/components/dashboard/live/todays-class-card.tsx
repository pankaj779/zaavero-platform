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
import { CountdownTimer } from './countdown-timer';

export function TodaysClassCard({ liveClass }: { liveClass: LiveClassDto }): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="todays-live-heading">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{liveStatusLabel[liveClass.status]}</Badge>
          {liveClass.isLive ? <Badge variant="primary">Live</Badge> : null}
        </div>
        <CardTitle id="todays-live-heading" className="text-xl">
          {liveClass.title}
        </CardTitle>
        <CardDescription>{liveClass.description}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 tablet:grid-cols-2">
        <dl className="grid gap-3 text-small">
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.courseLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{liveClass.course.title}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.mentorLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{liveClass.mentor.name}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.dateLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatLiveDate(liveClass.startTime)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.timeLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatLiveTimeRange(liveClass.startTime, liveClass.endTime)}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.durationLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{liveClass.duration.label}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.timezoneLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{liveClass.timezone}</dd>
          </div>
        </dl>

        <CountdownTimer
          startTime={liveClass.startTime}
          endTime={liveClass.endTime}
          isLive={liveClass.isLive}
        />
      </CardContent>

      <CardFooter>
        <Button type="button" variant="primary" size="md" className="w-full tablet:w-auto" disabled>
          {livePageCopy.joinComingSoon}
        </Button>
      </CardFooter>
    </Card>
  );
}
