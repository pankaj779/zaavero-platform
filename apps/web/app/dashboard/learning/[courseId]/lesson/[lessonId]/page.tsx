import { LessonPlayerWorkspace } from '../../../../../../components/dashboard/student-learning';

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<React.JSX.Element> {
  const { courseId, lessonId } = await params;
  return <LessonPlayerWorkspace courseId={courseId} lessonId={lessonId} />;
}
