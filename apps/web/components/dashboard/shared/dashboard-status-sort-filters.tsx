'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@graphology/ui';

export interface DashboardSelectOption<T extends string> {
  value: T;
  label: string;
}

export function DashboardStatusSortFilters<TStatus extends string, TSort extends string>({
  status,
  sort,
  statusOptions,
  sortOptions,
  statusFilterLabel,
  sortLabel,
  statusSelectId,
  sortSelectId,
  onStatusChange,
  onSortChange,
}: {
  status: TStatus;
  sort: TSort;
  statusOptions: readonly DashboardSelectOption<TStatus>[];
  sortOptions: readonly DashboardSelectOption<TSort>[];
  statusFilterLabel: string;
  sortLabel: string;
  statusSelectId: string;
  sortSelectId: string;
  onStatusChange: (value: TStatus) => void;
  onSortChange: (value: TSort) => void;
}): React.JSX.Element {
  return (
    <div className="flex w-full flex-col gap-3 tablet:flex-row tablet:items-center">
      <div className="w-full tablet:max-w-[14rem]">
        <label className="sr-only" htmlFor={statusSelectId}>
          {statusFilterLabel}
        </label>
        <Select
          value={status}
          onValueChange={(value) => {
            onStatusChange(value as TStatus);
          }}
        >
          <SelectTrigger id={statusSelectId} aria-label={statusFilterLabel}>
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full tablet:max-w-[12rem]">
        <label className="sr-only" htmlFor={sortSelectId}>
          {sortLabel}
        </label>
        <Select
          value={sort}
          onValueChange={(value) => {
            onSortChange(value as TSort);
          }}
        >
          <SelectTrigger id={sortSelectId} aria-label={sortLabel}>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
