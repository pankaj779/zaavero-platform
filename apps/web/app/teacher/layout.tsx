import { TeacherShell } from '../../components/teacher/layout';

export default function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return <TeacherShell>{children}</TeacherShell>;
}
