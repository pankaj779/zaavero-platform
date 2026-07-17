'use client';

import { SearchInput } from '@graphology/ui';

export function DashboardSearch({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <SearchInput
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="w-full"
    />
  );
}
