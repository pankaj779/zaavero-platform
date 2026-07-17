import { Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import {
  certificatesPageCopy,
  type CertificateDto,
  type CertificateTimelineStepDto,
} from '../../../lib/dashboard';

function stepDotClass(state: CertificateTimelineStepDto['state']): string {
  switch (state) {
    case 'complete':
      return 'bg-foreground';
    case 'current':
      return 'bg-foreground ring-2 ring-ring ring-offset-2 ring-offset-card';
    case 'inactive':
      return 'bg-muted border border-dashed border-border';
    default:
      return 'bg-border';
  }
}

export function CertificateTimeline({
  certificate,
}: {
  certificate: CertificateDto | null;
}): React.JSX.Element {
  if (!certificate) {
    return (
      <Card className="rounded-xl shadow-sm" aria-labelledby="certificate-timeline-heading">
        <CardHeader>
          <CardTitle id="certificate-timeline-heading" className="text-base">
            {certificatesPageCopy.timelineTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-small text-muted-foreground">{certificatesPageCopy.detailsEmpty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="certificate-timeline-heading">
      <CardHeader>
        <CardTitle id="certificate-timeline-heading" className="text-base">
          {certificatesPageCopy.timelineTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-0" aria-label={certificatesPageCopy.timelineTitle}>
          {certificate.timeline.map((step, index) => {
            const isLast = index === certificate.timeline.length - 1;
            const inactive = step.state === 'inactive';

            return (
              <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast ? (
                  <span
                    className={cn(
                      'absolute left-[0.55rem] top-6 h-[calc(100%-1.5rem)] w-px',
                      inactive ? 'bg-border/60' : 'bg-border',
                    )}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    'relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none',
                    stepDotClass(step.state),
                  )}
                  aria-hidden
                />
                <div className={cn('min-w-0 space-y-1', inactive && 'opacity-60')}>
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="text-small text-muted-foreground">{step.description}</p>
                  {inactive ? (
                    <p className="text-caption text-muted-foreground">
                      {certificatesPageCopy.comingSoon}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
