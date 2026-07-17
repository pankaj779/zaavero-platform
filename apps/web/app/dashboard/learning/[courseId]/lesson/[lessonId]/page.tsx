import { LessonPlayer } from '../../../../../../components/dashboard/lesson';
import { getLessonPlayerData } from '../../../../../../lib/dashboard';

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}): Promise<React.JSX.Element> {
  const { courseId, lessonId } = await params;
  const data = getLessonPlayerData(courseId, lessonId);

  return <LessonPlayer data={data} />;
}
