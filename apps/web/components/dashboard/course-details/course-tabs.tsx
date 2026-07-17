'use client';

import { cn } from '@graphology/utils';
import type { ReactNode } from 'react';
import { courseTabItems, type CourseTabId } from '../../../lib/dashboard';

export function CourseTabs({
  activeTab,
  onTabChange,
  panels,
}: {
  activeTab: CourseTabId;
  onTabChange: (tab: CourseTabId) => void;
  panels: Record<CourseTabId, ReactNode>;
}): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Course sections"
        className="flex flex-wrap gap-2 border-b border-border"
      >
        {courseTabItems.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`course-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`course-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                'rounded-t-md px-3 py-2 text-sm font-medium transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              onClick={() => {
                onTabChange(tab.id);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {courseTabItems.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`course-panel-${tab.id}`}
            aria-labelledby={`course-tab-${tab.id}`}
            hidden={!selected}
            className={cn(!selected && 'hidden')}
          >
            {selected ? panels[tab.id] : null}
          </div>
        );
      })}
    </div>
  );
}
