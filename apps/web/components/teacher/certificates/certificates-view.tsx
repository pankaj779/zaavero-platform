'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CertificateApi } from '../../../lib/api';
import { useOrganization } from '../../../lib/auth';
import {
  deriveTeacherCertificateBatches,
  deriveTeacherCertificateTemplates,
  filterTeacherCertificates,
  sortTeacherCertificates,
  toCertificateApiStatus,
  toCertificateListSort,
  type CertificateBatchDto,
  type CertificateTemplateDto,
  type StudentCertificateDto,
  type TeacherCertificateSortOption,
  type TeacherCertificateStatusFilter,
  type TeacherCertificatesViewState,
} from '../../../lib/teacher';
import { CertificateStats } from './certificate-stats';
import { CertificatesEmptyState } from './certificates-empty-state';
import { CertificatesErrorState } from './certificates-error-state';
import { CertificatesHeader } from './certificates-header';
import { CertificatesSkeleton } from './certificates-skeleton';
import { CertificatesWorkspace } from './certificates-workspace';

const LIST_LIMIT = 100;
const SEARCH_DEBOUNCE_MS = 300;

export function CertificatesView({
  initialCertificates,
  initialTemplates,
  initialBatches,
  initialViewState,
}: {
  /** Optional override for tests — skips network when provided with a view state. */
  initialCertificates?: StudentCertificateDto[];
  initialTemplates?: CertificateTemplateDto[];
  initialBatches?: CertificateBatchDto[];
  initialViewState?: TeacherCertificatesViewState;
} = {}): React.JSX.Element {
  const { primaryOrganizationId } = useOrganization();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState<TeacherCertificateStatusFilter>('all');
  const [sort, setSort] = useState<TeacherCertificateSortOption>('newest');

  const [viewState, setViewState] = useState<TeacherCertificatesViewState>(
    initialViewState ?? 'loading',
  );
  const [certificates, setCertificates] = useState<StudentCertificateDto[]>(
    initialCertificates ?? [],
  );
  const [statsCertificates, setStatsCertificates] = useState<StudentCertificateDto[]>(
    initialCertificates ?? [],
  );
  const [templates, setTemplates] = useState<CertificateTemplateDto[]>(initialTemplates ?? []);
  const [batches, setBatches] = useState<CertificateBatchDto[]>(initialBatches ?? []);
  const hasLoadedRef = useRef(initialViewState !== undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const loadStats = useCallback(
    async (signal: AbortSignal) => {
      const result = await CertificateApi.getCertificates({
        organizationId: primaryOrganizationId ?? undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });
      if (signal.aborted) {
        return;
      }
      setStatsCertificates(result.items);
      setBatches(deriveTeacherCertificateBatches(result.items));
      setTemplates(deriveTeacherCertificateTemplates(result.items, result.templateIds));
    },
    [primaryOrganizationId],
  );

  const loadList = useCallback(
    async (signal: AbortSignal) => {
      const { sortBy, sortOrder } = toCertificateListSort(sort);

      // Backend search only matches certificateNumber. Broad student/course/batch
      // search stays client-side after enrichment.
      const searchLooksLikeCertNumber =
        debouncedQuery.trim().length > 0 &&
        /^[A-Za-z0-9-]{3,}$/.test(debouncedQuery.trim()) &&
        !debouncedQuery.includes(' ');

      const result = await CertificateApi.getCertificates({
        organizationId: primaryOrganizationId ?? undefined,
        status: toCertificateApiStatus(status),
        search: searchLooksLikeCertNumber ? debouncedQuery.trim() : undefined,
        page: 1,
        limit: LIST_LIMIT,
        sortBy,
        sortOrder,
      });
      if (signal.aborted) {
        return;
      }

      const filtered = filterTeacherCertificates(result.items, debouncedQuery, 'all');
      const sorted = sortTeacherCertificates(filtered, sort);

      setCertificates(sorted);

      const filtersActive = debouncedQuery.trim().length > 0 || status !== 'all';
      if (sorted.length === 0 && !filtersActive) {
        setViewState('empty');
      } else {
        setViewState('populated');
      }
    },
    [debouncedQuery, primaryOrganizationId, sort, status],
  );

  useEffect(() => {
    if (initialViewState !== undefined && initialCertificates !== undefined) {
      return;
    }

    const controller = new AbortController();
    const isFirstLoad = !hasLoadedRef.current;
    if (isFirstLoad) {
      setViewState('loading');
    }

    void (async () => {
      try {
        if (isFirstLoad) {
          await Promise.all([loadStats(controller.signal), loadList(controller.signal)]);
        } else {
          await loadList(controller.signal);
        }
        hasLoadedRef.current = true;
      } catch {
        if (!controller.signal.aborted) {
          setViewState('error');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialCertificates, initialViewState, loadList, loadStats]);

  if (viewState === 'loading') {
    return (
      <div className="space-y-8">
        <CertificatesHeader />
        <CertificatesSkeleton />
      </div>
    );
  }

  if (viewState === 'error') {
    return (
      <div className="space-y-8">
        <CertificatesHeader />
        <CertificatesErrorState />
      </div>
    );
  }

  if (viewState === 'empty') {
    return (
      <div className="space-y-8">
        <CertificatesHeader />
        <CertificatesEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CertificatesHeader />
      <CertificateStats certificates={statsCertificates} />
      <CertificatesWorkspace
        certificates={certificates}
        templates={templates}
        batches={batches}
        query={query}
        status={status}
        sort={sort}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onSortChange={setSort}
        serverFiltered
      />
    </div>
  );
}
