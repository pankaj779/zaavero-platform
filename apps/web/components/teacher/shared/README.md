# Teacher Portal shared UI

Reusable primitives for Teacher Portal modules. Prefer these over re-implementing
empty/error/header/details shells in each feature folder.

## Exports

| Export                    | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `TeacherPageHeader`       | Standard module page header                |
| `TeacherModuleEmptyState` | Empty / no-matches / no-selection states   |
| `TeacherModuleErrorState` | Module load failures                       |
| `TeacherDetailsPanel`     | Dismissible details shell (Escape + focus) |
| `TeacherDetailList`       | Definition list for panel rows             |
| `TeacherGridListToggle`   | Grid/list view toggle                      |
| `teacherCardSurfaceClass` | Card hover/transition classes (200ms)      |
| `TeacherComingSoonPage`   | Placeholder route page                     |
| `ComingSoonBadge`         | Compact coming-soon badge                  |
| `TeacherSectionCard`      | Dashboard section card                     |

Do not redesign visuals here — keep behavior and look aligned with existing modules.
