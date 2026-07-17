'use client';

import { Button } from '@graphology/ui';
import { teacherCalendarPageCopy } from '../../../lib/teacher';

export function CalendarToolbar({
  monthLabel,
  onPrevious,
  onNext,
  onToday,
}: {
  monthLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}): React.JSX.Element {
  const copy = teacherCalendarPageCopy;

  return (
    <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
      <h2 className="text-base font-semibold text-foreground">{monthLabel}</h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Month navigation">
        <Button type="button" variant="outline" size="sm" aria-label={copy.previousMonthLabel} onClick={onPrevious}>
          Previous
        </Button>
        <Button type="button" variant="secondary" size="sm" aria-label={copy.todayLabel} onClick={onToday}>
          {copy.todayLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" aria-label={copy.nextMonthLabel} onClick={onNext}>
          Next
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled aria-label={`${copy.createEventButton} — coming soon`}>
          {copy.createEventButton}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled aria-label={`${copy.syncButton} — coming soon`}>
          {copy.syncButton}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          aria-label={`${copy.connectProviderButton} — coming soon`}
        >
          {copy.connectProviderButton}
        </Button>
      </div>
      <p className="w-full text-caption text-muted-foreground">{copy.comingSoonNote}</p>
    </div>
  );
}
