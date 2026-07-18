import { CourseDetailsWorkspace } from '../../../../components/dashboard/student-learning';

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<React.JSX.Element> {
  const { courseId } = await params;
  return <CourseDetailsWorkspace courseId={courseId} />;
}
