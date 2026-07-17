import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { livePageCopy, type LiveMeetingDetailsDto } from '../../../lib/dashboard';

export function MeetingDetails({
  details,
}: {
  details: LiveMeetingDetailsDto;
}): React.JSX.Element {
  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="meeting-details-heading">
      <CardHeader>
        <CardTitle id="meeting-details-heading" className="text-base">
          {livePageCopy.meetingDetailsTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-small">
        <dl className="grid gap-3">
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.platformLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{details.platformLabel}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.meetingIdLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{details.meetingIdPlaceholder}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">{livePageCopy.passwordLabel}</dt>
            <dd className="mt-1 font-medium text-foreground">{details.passwordPlaceholder}</dd>
          </div>
        </dl>

        <div>
          <h3 className="text-caption font-medium text-muted-foreground">
            {livePageCopy.requirementsLabel}
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
            {details.requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-caption font-medium text-muted-foreground">
            {livePageCopy.preparationLabel}
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground">
            {details.preparation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-caption font-medium text-muted-foreground">
            {livePageCopy.instructionsLabel}
          </h3>
          <p className="mt-2 leading-relaxed text-muted-foreground">{details.joinInstructions}</p>
        </div>
      </CardContent>
    </Card>
  );
}
