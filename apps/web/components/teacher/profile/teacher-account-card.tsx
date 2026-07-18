import { Badge, Card, CardContent, CardHeader, CardTitle } from '@graphology/ui';
import {
  formatTeacherProfileDate,
  teacherProfilePageCopy,
  type TeacherProfileDto,
} from '../../../lib/teacher';

export function TeacherAccountCard({ profile }: { profile: TeacherProfileDto }): React.JSX.Element {
  const copy = teacherProfilePageCopy;

  return (
    <Card className="rounded-xl shadow-sm" aria-labelledby="teacher-account-heading">
      <CardHeader>
        <CardTitle id="teacher-account-heading" className="text-base">
          {copy.accountTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-3">
          <div>
            <p className="text-caption text-muted-foreground">{copy.roleLabel}</p>
            <p className="text-sm font-medium text-foreground">Teacher</p>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
        <dl className="grid gap-3 text-small">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">{copy.emailLabel}</dt>
            <dd className="text-right font-medium text-foreground">{profile.email}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-muted-foreground">{copy.joinedLabel}</dt>
            <dd className="text-right font-medium text-foreground">
              {formatTeacherProfileDate(profile.joinedAt)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
