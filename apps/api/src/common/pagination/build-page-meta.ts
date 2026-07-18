export interface PageMetaInput {
  total: number;
  page: number;
  limit: number;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildPageMeta(input: PageMetaInput): PageMeta {
  const totalPages = input.total === 0 ? 0 : Math.ceil(input.total / input.limit);

  return {
    total: input.total,
    page: input.page,
    limit: input.limit,
    totalPages,
  };
}
