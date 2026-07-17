import { CourseDetailsView } from '../../../../components/dashboard/course-details';
import { getCourseDetailsById } from '../../../../lib/dashboard';

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}): Promise<React.JSX.Element> {
  const { courseId } = await params;
  const course = getCourseDetailsById(courseId);

  return <CourseDetailsView course={course} />;
}
