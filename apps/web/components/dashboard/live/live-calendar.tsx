'use client';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import { cn } from '@graphology/utils';
import { useMemo, useState } from 'react';
import { icons } from '../../../lib/constants';
import { livePageCopy, toLocalDateKey } from '../../../lib/dashboard';

const ChevronLeftIcon = icons.chevronLeft;
const ChevronRightIcon = icons.chevronRight;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Monday-first index for local calendars */
function mondayFirstWeekday(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

export function LiveCalendar({
  highlightedDateKeys,
}: {
  highlightedDateKeys: string[];
}): React.JSX.Element {
  const highlightSet = useMemo(() => new Set(highlightedDateKeys), [highlightedDateKeys]);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const cells = useMemo(() => {
    const totalDays = daysInMonth(cursor);
    const offset = mondayFirstWeekday(cursor);
    const items: { key: string; day: number | null; dateKey: string | null }[] = [];

    for (let i = 0; i < offset; i += 1) {
      items.push({ key: `pad-${String(i)}`, day: null, dateKey: null });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      items.push({
        key: toLocalDateKey(date),
        day,
        dateKey: toLocalDateKey(date),
      });
    }

    return items;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const todayKey = toLocalDateKey(new Date());

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="live-calendar-heading">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle id="live-calendar-heading" className="text-base">
            {livePageCopy.calendarTitle}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={livePageCopy.calendarPrev}
              onClick={() => {
                setCursor(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                );
              }}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={livePageCopy.calendarNext}
              onClick={() => {
                setCursor(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                );
              }}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {monthLabel}
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center text-caption text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label={monthLabel}>
          {cells.map((cell) => {
            if (cell.day === null || !cell.dateKey) {
              return <div key={cell.key} className="h-9" aria-hidden />;
            }

            const highlighted = highlightSet.has(cell.dateKey);
            const isToday = cell.dateKey === todayKey;

            return (
              <div
                key={cell.key}
                role="gridcell"
                aria-selected={highlighted}
                aria-current={isToday ? 'date' : undefined}
                className={cn(
                  'flex h-9 items-center justify-center rounded-md text-caption transition-colors duration-200 motion-reduce:transition-none',
                  isToday && 'ring-1 ring-ring',
                  highlighted
                    ? 'bg-foreground font-semibold text-background'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <span>{cell.day}</span>
                {highlighted ? <span className="sr-only">, live class scheduled</span> : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
