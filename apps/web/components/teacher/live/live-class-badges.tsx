import { Badge } from '@graphology/ui';
import {
  teacherLiveClassStatusLabel,
  teacherMeetingStatusLabel,
  type TeacherLiveClassStatus,
  type TeacherMeetingStatus,
} from '../../../lib/teacher';

const liveClassVariant: Record<
  TeacherLiveClassStatus,
  'warning' | 'primary' | 'success' | 'neutral'
> = {
  scheduled: 'warning',
  live: 'primary',
  completed: 'success',
  cancelled: 'neutral',
};

const meetingVariant: Record<
  TeacherMeetingStatus,
  'warning' | 'success' | 'primary' | 'secondary' | 'neutral'
> = {
  setup_pending: 'warning',
  ready: 'success',
  in_progress: 'primary',
  ended: 'secondary',
  cancelled: 'neutral',
};

export function LiveClassStatusBadge({
  status,
}: {
  status: TeacherLiveClassStatus;
}): React.JSX.Element {
  return <Badge variant={liveClassVariant[status]}>{teacherLiveClassStatusLabel[status]}</Badge>;
}

export function MeetingStatusBadge({
  status,
}: {
  status: TeacherMeetingStatus;
}): React.JSX.Element {
  return <Badge variant={meetingVariant[status]}>{teacherMeetingStatusLabel[status]}</Badge>;
}
