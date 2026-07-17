import { brandConfig } from '../../../lib/brand';

export function TeacherFooter(): React.JSX.Element {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border px-4 py-4 tablet:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 text-caption text-muted-foreground tablet:flex-row">
        <p>
          © {year} {brandConfig.company.name}. {brandConfig.copyright}
        </p>
        <p>Teacher Portal · Preview shell — modules activate as they ship.</p>
      </div>
    </footer>
  );
}
