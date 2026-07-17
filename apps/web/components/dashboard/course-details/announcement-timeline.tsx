import {
  courseDetailsCopy,
  formatAnnouncementDate,
  type CourseAnnouncementDto,
} from '../../../lib/dashboard';

export function AnnouncementTimeline({
  announcements,
}: {
  announcements: CourseAnnouncementDto[];
}): React.JSX.Element {
  if (announcements.length === 0) {
    return (
      <p className="text-small text-muted-foreground">{courseDetailsCopy.announcementsEmpty}</p>
    );
  }

  return (
    <ol className="space-y-0" aria-label="Course announcements">
      {announcements.map((item, index) => {
        const isLast = index === announcements.length - 1;
        return (
          <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[0.55rem] top-6 h-[calc(100%-1.5rem)] w-px bg-border"
                aria-hidden
              />
            ) : null}
            <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border border-border bg-card" />
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">
                {formatAnnouncementDate(item.publishedAt)}
              </p>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="text-small text-muted-foreground">{item.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
