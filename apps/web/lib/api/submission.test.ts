import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiFetchMock, getAssignmentsMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  getAssignmentsMock: vi.fn(),
}));

vi.mock('../auth/api-client', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('./assignment', () => ({
  AssignmentApi: {
    getAssignments: getAssignmentsMock,
  },
}));

import { SubmissionApi } from './submission';

describe('SubmissionApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    getAssignmentsMock.mockReset();
    getAssignmentsMock.mockResolvedValue({
      items: [
        {
          id: '55555555-5555-4555-8555-555555555555',
          title: 'Foundations Essay',
          course: {
            id: '33333333-3333-4333-8333-333333333333',
            slug: 'foundations',
            title: 'Foundations',
          },
          grading: { maxScore: 100 },
        },
      ],
      meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
    });
  });

  it('getSubmissions maps payload and enriches assignment/course', async () => {
    apiFetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          organizationId: '22222222-2222-4222-8222-222222222222',
          assignmentId: '55555555-5555-4555-8555-555555555555',
          studentId: '66666666-6666-4666-8666-666666666666',
          status: 'SUBMITTED',
          content: 'My essay',
          attachments: ['file-a.pdf'],
          score: null,
          feedback: null,
          submittedAt: '2026-07-20T10:00:00.000Z',
          gradedAt: null,
          gradedById: null,
          createdAt: '2026-07-20T09:00:00.000Z',
          updatedAt: '2026-07-20T10:00:00.000Z',
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const result = await SubmissionApi.getSubmissions({
      organizationId: '22222222-2222-4222-8222-222222222222',
      status: 'SUBMITTED',
      assignmentId: '55555555-5555-4555-8555-555555555555',
      sortBy: 'submittedAt',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
    });

    expect(apiFetchMock).toHaveBeenCalledWith(
      '/submissions?organizationId=22222222-2222-4222-8222-222222222222&assignmentId=55555555-5555-4555-8555-555555555555&status=SUBMITTED&page=1&limit=20&sortBy=submittedAt&sortOrder=asc',
    );
    expect(getAssignmentsMock).toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.status).toBe('submitted');
    expect(result.items[0]?.assignment.title).toBe('Foundations Essay');
    expect(result.items[0]?.assignment.course.title).toBe('Foundations');
    expect(result.items[0]?.student.fullName).toBe('Student');
    expect(result.items[0]?.attachments[0]?.label).toBe('file-a.pdf');
    expect(result.meta.total).toBe(1);
  });

  it('getSubmission / create / update return mapped DTOs', async () => {
    const record = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      assignmentId: '55555555-5555-4555-8555-555555555555',
      studentId: '66666666-6666-4666-8666-666666666666',
      status: 'GRADED',
      content: null,
      attachments: [],
      score: 88,
      feedback: 'Well done',
      submittedAt: '2026-07-20T10:00:00.000Z',
      gradedAt: '2026-07-21T10:00:00.000Z',
      gradedById: '77777777-7777-4777-8777-777777777777',
      createdAt: '2026-07-20T09:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z',
    };

    apiFetchMock.mockResolvedValue(record);

    await expect(SubmissionApi.getSubmission(record.id)).resolves.toMatchObject({
      id: record.id,
      status: 'graded',
      score: 88,
      grader: { id: record.gradedById, name: 'Teacher' },
    });

    await SubmissionApi.createSubmission({
      organizationId: record.organizationId,
      assignmentId: record.assignmentId,
      studentId: record.studentId,
    });
    expect(apiFetchMock).toHaveBeenCalledWith('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: record.organizationId,
        assignmentId: record.assignmentId,
        studentId: record.studentId,
      }),
    });

    await SubmissionApi.updateSubmission(record.id, { status: 'RETURNED', feedback: 'Revise' });
    expect(apiFetchMock).toHaveBeenCalledWith(`/submissions/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'RETURNED', feedback: 'Revise' }),
    });
  });
});
