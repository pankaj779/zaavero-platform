import {
  getFeaturedLiveClass,
  getLiveClassDateKeys,
  getTodaysLiveClass,
  getUpcomingLiveClasses,
  livePageCopy,
  liveViewState,
  type LiveClassDto,
  type LiveClassViewState,
} from '../../../lib/dashboard';
import { InstructorCard } from './instructor-card';
import { LiveCalendar } from './live-calendar';
import { LiveEmptyState } from './live-empty-state';
import { LiveErrorState } from './live-error-state';
import { LiveHeader } from './live-header';
import { LiveSkeleton } from './live-skeleton';
import { MeetingDetails } from './meeting-details';
import { TodaysClassCard } from './todays-class-card';
import { UpcomingClassCard } from './upcoming-class-card';

export function LivePageView({
  classes,
  viewState = liveViewState,
}: {
  classes: LiveClassDto[];
  viewState?: LiveClassViewState;
}): React.JSX.Element {
  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <LiveHeader />
        <LiveSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <LiveHeader />
        <LiveErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || classes.length === 0) {
    return (
      <div className="space-y-8">
        <LiveHeader />
        <LiveEmptyState />
      </div>
    );
  }

  const todaysClass = getTodaysLiveClass(classes);
  const upcoming = getUpcomingLiveClasses(classes);
  const featured = getFeaturedLiveClass(classes);
  const highlightedDateKeys = getLiveClassDateKeys(classes);

  return (
    <div className="space-y-8">
      <LiveHeader />

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_20rem] laptop:items-start">
        <div className="min-w-0 space-y-8">
          <section className="space-y-4" aria-labelledby="todays-section-heading">
            <h2 id="todays-section-heading" className="text-lg font-semibold text-foreground">
              {livePageCopy.todaysTitle}
            </h2>
            {todaysClass ? (
              <TodaysClassCard liveClass={todaysClass} />
            ) : (
              <p className="text-small text-muted-foreground">{livePageCopy.todaysEmpty}</p>
            )}
          </section>

          <section className="space-y-4" aria-labelledby="upcoming-section-heading">
            <h2 id="upcoming-section-heading" className="text-lg font-semibold text-foreground">
              {livePageCopy.upcomingTitle}
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-small text-muted-foreground">{livePageCopy.upcomingEmpty}</p>
            ) : (
              <ul className="grid gap-4 tablet:grid-cols-2">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <UpcomingClassCard liveClass={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="laptop:hidden">
            <LiveCalendar highlightedDateKeys={highlightedDateKeys} />
          </div>
        </div>

        <aside className="space-y-4 laptop:sticky laptop:top-20" aria-label="Live class details">
          <div className="hidden laptop:block">
            <LiveCalendar highlightedDateKeys={highlightedDateKeys} />
          </div>
          {featured ? (
            <>
              <InstructorCard mentor={featured.mentor} />
              <MeetingDetails details={featured.meetingDetails} />
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
