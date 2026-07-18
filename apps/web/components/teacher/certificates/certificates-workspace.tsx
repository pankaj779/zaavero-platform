'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  filterTeacherCertificates,
  getTeacherCertificateById,
  sortTeacherCertificates,
  teacherCertificatesPageCopy,
  type CertificateBatchDto,
  type CertificateTemplateDto,
  type StudentCertificateDto,
  type TeacherCertificateSortOption,
  type TeacherCertificateStatusFilter,
} from '../../../lib/teacher';
import { CertificateBatchCard } from './certificate-batch-card';
import { CertificateCollection } from './certificate-collection';
import { CertificateDetails } from './certificate-details';
import { CertificateFilters } from './certificate-filters';
import { CertificateSearch } from './certificate-search';
import { CertificateTemplateCard } from './certificate-template-card';
import { CertificatesEmptyState } from './certificates-empty-state';

/** Client boundary for search, filters, sorting, and selection. */
export function CertificatesWorkspace({
  certificates,
  templates,
  batches,
  query: controlledQuery,
  status: controlledStatus,
  sort: controlledSort,
  onQueryChange,
  onStatusChange,
  onSortChange,
  serverFiltered = false,
}: {
  certificates: StudentCertificateDto[];
  templates: CertificateTemplateDto[];
  batches: CertificateBatchDto[];
  query?: string;
  status?: TeacherCertificateStatusFilter;
  sort?: TeacherCertificateSortOption;
  onQueryChange?: (value: string) => void;
  onStatusChange?: (value: TeacherCertificateStatusFilter) => void;
  onSortChange?: (value: TeacherCertificateSortOption) => void;
  /** When true, parent already applied server/client list filters — skip local filter/sort. */
  serverFiltered?: boolean;
}): React.JSX.Element {
  const copy = teacherCertificatesPageCopy;
  const [localQuery, setLocalQuery] = useState('');
  const [localStatus, setLocalStatus] = useState<TeacherCertificateStatusFilter>('all');
  const [localSort, setLocalSort] = useState<TeacherCertificateSortOption>('newest');
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(
    certificates[0]?.id ?? null,
  );

  const query = controlledQuery ?? localQuery;
  const status = controlledStatus ?? localStatus;
  const sort = controlledSort ?? localSort;

  useEffect(() => {
    if (selectedCertificateId === null) {
      return;
    }
    if (!certificates.some((certificate) => certificate.id === selectedCertificateId)) {
      setSelectedCertificateId(certificates[0]?.id ?? null);
    }
  }, [certificates, selectedCertificateId]);

  const visibleCertificates = useMemo(() => {
    if (serverFiltered) {
      return certificates;
    }
    const filtered = filterTeacherCertificates(certificates, query, status);
    return sortTeacherCertificates(filtered, sort);
  }, [certificates, query, serverFiltered, sort, status]);

  const selectedCertificate = useMemo(
    () =>
      selectedCertificateId === null
        ? null
        : getTeacherCertificateById(certificates, selectedCertificateId),
    [certificates, selectedCertificateId],
  );

  return (
    <div className="space-y-4">
      <section className="space-y-3" aria-label="Certificate filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <CertificateSearch value={query} onChange={onQueryChange ?? setLocalQuery} />
          </div>
          <CertificateFilters
            status={status}
            sort={sort}
            onStatusChange={onStatusChange ?? setLocalStatus}
            onSortChange={onSortChange ?? setLocalSort}
          />
        </div>
      </section>

      <div className="grid gap-4 laptop:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,16rem)]">
        <aside className="order-1 min-w-0" aria-label={copy.collectionLabel}>
          {visibleCertificates.length === 0 ? (
            <CertificatesEmptyState variant="no-matches" />
          ) : (
            <CertificateCollection
              certificates={visibleCertificates}
              selectedCertificateId={selectedCertificateId}
              onSelect={setSelectedCertificateId}
            />
          )}
        </aside>

        <section className="order-2 min-w-0" aria-label={copy.detailsLabel}>
          {selectedCertificate ? (
            <CertificateDetails
              certificate={selectedCertificate}
              onClose={() => {
                setSelectedCertificateId(null);
              }}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
              <CertificatesEmptyState variant="no-selection" />
            </div>
          )}
        </section>

        <aside className="order-3 flex min-w-0 flex-col gap-4" aria-label="Templates and batches">
          <section className="space-y-3" aria-label={copy.templatesLabel}>
            <h3 className="text-small font-semibold text-foreground">{copy.templatesLabel}</h3>
            <ul className="flex flex-col gap-3">
              {templates.map((template) => (
                <li key={template.id}>
                  <CertificateTemplateCard template={template} />
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3" aria-label={copy.batchesLabel}>
            <h3 className="text-small font-semibold text-foreground">{copy.batchesLabel}</h3>
            <ul className="flex flex-col gap-3">
              {batches.map((batch) => (
                <li key={batch.id}>
                  <CertificateBatchCard batch={batch} />
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
