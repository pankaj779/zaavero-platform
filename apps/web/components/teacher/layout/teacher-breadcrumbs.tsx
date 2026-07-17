import Link from 'next/link';

export interface TeacherBreadcrumbItem {
  label: string;
  href?: string;
}

export function TeacherBreadcrumbs({
  items,
}: {
  items: TeacherBreadcrumbItem[];
}): React.JSX.Element {
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 tablet:block">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? 'truncate font-medium text-foreground' : undefined}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? <span aria-hidden>/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
