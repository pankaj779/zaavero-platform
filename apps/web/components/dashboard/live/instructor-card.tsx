import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@graphology/ui';
import { icons } from '../../../lib/constants';
import { livePageCopy, type LiveMentorDto } from '../../../lib/dashboard';

const UserIcon = icons.user;

export function InstructorCard({ mentor }: { mentor: LiveMentorDto }): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="live-instructor-heading">
      <CardHeader className="space-y-4">
        <CardTitle id="live-instructor-heading" className="text-base">
          {livePageCopy.instructorTitle}
        </CardTitle>
        <div className="flex items-start gap-3">
          <span
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
            aria-hidden
          >
            <UserIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">{mentor.name}</p>
            <p className="text-caption text-muted-foreground">{mentor.role}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="leading-relaxed">{mentor.bio}</CardDescription>
      </CardContent>
    </Card>
  );
}
