'use client';

import { teacherAnalyticsPageCopy, type TeacherAnalyticsMetricDto } from '../../../lib/teacher';
import { TeacherDetailList, TeacherDetailsPanel } from '../shared';

/** Keyboard-accessible details panel for a selected analytics metric. */
export function AnalyticsDetailsPanel({
  metric,
  onClose,
}: {
  metric: TeacherAnalyticsMetricDto;
  onClose: () => void;
}): React.JSX.Element {
  const copy = teacherAnalyticsPageCopy;

  return (
    <TeacherDetailsPanel
      ariaLabel={`${copy.detailsPanelLabel}: ${metric.label}`}
      closeLabel={copy.detailsCloseLabel}
      title={metric.label}
      eyebrow={
        <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
          {metric.kind === 'kpi' ? 'KPI' : 'Section'}
        </p>
      }
      subtitle={
        <p className="text-small text-muted-foreground">{`Display value: ${metric.value}`}</p>
      }
      onClose={onClose}
      focusKey={metric.id}
      contentClassName="grid gap-4 p-5 pt-0 tablet:grid-cols-2"
    >
      <TeacherDetailList
        layout="stack"
        rows={[
          {
            id: 'description',
            label: copy.descriptionLabel,
            value: metric.description,
          },
          {
            id: 'source',
            label: copy.calculationSourceLabel,
            value: metric.calculationSource,
          },
        ]}
      />
      <TeacherDetailList
        layout="stack"
        rows={[
          {
            id: 'api',
            label: copy.futureApiLabel,
            value: metric.futureApi,
          },
          {
            id: 'notes',
            label: copy.notesLabel,
            value: metric.notes,
          },
        ]}
      />
    </TeacherDetailsPanel>
  );
}
