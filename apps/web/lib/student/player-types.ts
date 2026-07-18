import type { TeacherLessonContentType } from '../teacher/lesson-types';
import type {
  StudentCourseModuleDto,
  StudentCourseRefDto,
  StudentIntegrationAvailability,
} from './course-types';
import type { StudentLessonProgressStatus } from './progress-types';

/**
 * Student lesson-player composed view-model.
 * Content URLs come from Lesson API; notes/resources remain honestly disabled.
 */

export interface StudentLessonNavigationDto {
  previousLessonId: string | null;
  nextLessonId: string | null;
}

export interface StudentLessonPlayerLessonDto {
  id: string;
  title: string;
  description: string;
  contentType: TeacherLessonContentType;
  contentUrl: string | null;
  durationSeconds: number | null;
  displayOrder: number;
  moduleId: string;
  progressStatus: StudentLessonProgressStatus;
  progressPercent: number;
  completedAt: string | null;
  lastPositionSeconds: number | null;
  navigation: StudentLessonNavigationDto;
}

export interface StudentLessonPlayerCapabilitiesDto {
  videoStreaming: StudentIntegrationAvailability;
  pdfViewer: StudentIntegrationAvailability;
  lessonNotes: StudentIntegrationAvailability;
  lessonResources: StudentIntegrationAvailability;
  bookmarks: StudentIntegrationAvailability;
  downloads: StudentIntegrationAvailability;
}

export interface StudentLessonPlayerDto {
  course: StudentCourseRefDto & {
    progress: {
      completedLessons: number;
      totalLessons: number;
      percentage: number;
    };
  };
  lesson: StudentLessonPlayerLessonDto;
  curriculum: StudentCourseModuleDto[];
  capabilities: StudentLessonPlayerCapabilitiesDto;
}
