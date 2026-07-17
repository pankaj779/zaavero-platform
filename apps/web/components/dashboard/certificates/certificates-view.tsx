'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  certificates,
  certificatesPageCopy,
  certificatesViewState,
  filterCertificates,
  sortCertificates,
  type CertificateDto,
  type CertificateSortOption,
  type CertificateStatusFilter,
  type CertificatesViewState,
} from '../../../lib/dashboard';
import { CertificateCard } from './certificate-card';
import { CertificateEmptyState } from './certificate-empty-state';
import { CertificateErrorState } from './certificate-error-state';
import { CertificateFilter } from './certificate-filter';
import { CertificatePreview } from './certificate-preview';
import { CertificateSearch } from './certificate-search';
import { CertificateSkeleton } from './certificate-skeleton';
import { CertificateStats } from './certificate-stats';
import { CertificateTimeline } from './certificate-timeline';
import { CertificatesHeader } from './certificates-header';

export function CertificatesView({
  items = certificates,
  viewState = certificatesViewState,
}: {
  items?: CertificateDto[];
  viewState?: CertificatesViewState;
}): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<CertificateStatusFilter>('all');
  const [sort, setSort] = useState<CertificateSortOption>('newest');
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  const visibleItems = useMemo(() => {
    const filtered = filterCertificates(items, query, status);
    return sortCertificates(filtered, sort);
  }, [items, query, sort, status]);

  useEffect(() => {
    if (visibleItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !visibleItems.some((item) => item.id === selectedId)) {
      setSelectedId(visibleItems[0]?.id ?? null);
    }
  }, [selectedId, visibleItems]);

  const selectedCertificate =
    visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0] ?? null;

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <CertificatesHeader />
        <CertificateSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <CertificatesHeader />
        <CertificateErrorState />
      </div>
    );
  }

  if (viewState === 'empty' || items.length === 0) {
    return (
      <div className="space-y-8">
        <CertificatesHeader />
        <CertificateEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CertificatesHeader />

      <CertificateStats items={items} />

      <section className="space-y-4" aria-label="Certificate filters">
        <div className="flex flex-col gap-3 laptop:flex-row laptop:items-center">
          <div className="w-full laptop:max-w-sm">
            <CertificateSearch value={query} onChange={setQuery} />
          </div>
          <CertificateFilter
            status={status}
            sort={sort}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        </div>
      </section>

      <div className="grid gap-6 laptop:grid-cols-[minmax(0,1fr)_22rem] laptop:items-start">
        <section className="min-w-0 space-y-4" aria-label={certificatesPageCopy.gridLabel}>
          {visibleItems.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No certificates match your search or filters.
            </p>
          ) : (
            <ul className="grid gap-4 tablet:grid-cols-2">
              {visibleItems.map((certificate) => (
                <li key={certificate.id}>
                  <CertificateCard
                    certificate={certificate}
                    selected={certificate.id === selectedCertificate?.id}
                    onSelect={setSelectedId}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside
          className="space-y-4 laptop:sticky laptop:top-20"
          aria-label={certificatesPageCopy.previewTitle}
        >
          <CertificatePreview certificate={selectedCertificate} />
          <CertificateTimeline certificate={selectedCertificate} />
        </aside>
      </div>
    </div>
  );
}
