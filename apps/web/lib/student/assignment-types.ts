import type { TeacherAssignmentStatus } from '../teacher/assignment-types';
import type { TeacherSubmissionStatus } from '../teacher/submission-types';
import type {
  StudentBatchRefDto,
  StudentCourseRefDto,
  StudentIntegrationAvailability,
} from './course-types';

/**
 * Student assignment + own-submission composed view-model.
 * Includes instructions discarded by the teacher assignment DTO.
 */

export interface StudentOwnSubmissionDto {
  id: string;
  status: TeacherSubmissionStatus;
  content: string | null;
  attachments: { id: string; label: string }[];
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  updatedAt: string;
}

export interface StudentAssignmentCapabilitiesDto {
  fileUploads: StudentIntegrationAvailability;
  plagiarismDetection: StudentIntegrationAvailability;
  aiEvaluation: StudentIntegrationAvailability;
}

export interface StudentAssignmentDto {
  id: string;
  title: string;
  instructions: string | null;
  status: TeacherAssignmentStatus;
  dueAt: string | null;
  maxScore: number | null;
  course: StudentCourseRefDto;
  batch: StudentBatchRefDto | null;
  submission: StudentOwnSubmissionDto | null;
  capabilities: StudentAssignmentCapabilitiesDto;
  updatedAt: string;
}

export interface StudentAssignmentListResult {
  items: StudentAssignmentDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
