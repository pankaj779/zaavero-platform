import { describe, expect, it } from 'vitest';
import {
  collectCertificateTemplateIds,
  mapCertificateApiList,
  mapCertificateApiToTeacherSummary,
  mapPublicCertificateVerification,
  type CertificateApiRecord,
} from './certificate-mapper';
import { toCertificateApiStatus, toCertificateListSort } from '../teacher/certificate-types';

const sampleRecord: CertificateApiRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '22222222-2222-4222-8222-222222222222',
  studentId: '66666666-6666-4666-8666-666666666666',
  courseId: '33333333-3333-4333-8333-333333333333',
  batchId: '44444444-4444-4444-8444-444444444444',
  templateId: '88888888-8888-4888-8888-888888888888',
  status: 'ISSUED',
  certificateNumber: 'CERT-001',
  verificationCode: 'VERIFY-001',
  pdfUrl: 'https://example.com/cert.pdf',
  issuedAt: '2026-07-10T09:00:00.000Z',
  revokedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-10T09:00:00.000Z',
};

describe('certificate mapper', () => {
  it('maps NestJS certificates to teacher DTOs with placeholders', () => {
    const dto = mapCertificateApiToTeacherSummary(sampleRecord);

    expect(dto.status).toBe('issued');
    expect(dto.student.name).toBe('Student');
    expect(dto.student.email).toBe('');
    expect(dto.course.title).toBe('Course');
    expect(dto.batch.name).toBe('Batch');
    expect(dto.mentor.name).toBe('Teacher');
    expect(dto.downloadUrl).toBe('https://example.com/cert.pdf');
    expect(dto.verificationCode).toBe('VERIFY-001');
    expect(dto.verificationUrl).toBe('http://localhost:3000/verify/VERIFY-001');
    expect(dto.certificateNumber).toBe('CERT-001');
    expect(dto.futureFeatures.pdfGeneration).toBe('available');
    expect(dto.futureFeatures.downloads).toBe('available');
    expect(dto.qrImageUrl).toBeNull();
  });

  it('enriches course and batch when lookups are provided', () => {
    const dto = mapCertificateApiToTeacherSummary(sampleRecord, {
      courses: new Map([
        [
          sampleRecord.courseId,
          {
            id: sampleRecord.courseId,
            slug: 'foundations',
            title: 'Foundations',
          },
        ],
      ]),
      batches: new Map([
        [
          '44444444-4444-4444-8444-444444444444',
          {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Weekend Cohort',
          },
        ],
      ]),
    });

    expect(dto.course.title).toBe('Foundations');
    expect(dto.course.slug).toBe('foundations');
    expect(dto.batch.name).toBe('Weekend Cohort');
  });

  it('maps lists without leaking API-only fields', () => {
    const [first] = mapCertificateApiList([sampleRecord]);
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('organizationId');
    expect(first).not.toHaveProperty('studentId');
    expect(first).not.toHaveProperty('courseId');
    expect(first).not.toHaveProperty('batchId');
    expect(first).not.toHaveProperty('templateId');
    expect(first?.verificationCode).toBe('VERIFY-001');
    expect(first).not.toHaveProperty('pdfUrl');
    expect(collectCertificateTemplateIds([sampleRecord]).get(sampleRecord.id)).toBe(
      sampleRecord.templateId,
    );
  });
});

describe('public certificate verification mapper', () => {
  it('maps only the scrubbed public payload', () => {
    const dto = mapPublicCertificateVerification({
      status: 'VALID',
      certificateNumber: 'CERT-001',
      verificationCode: 'VERIFY-001',
      studentName: 'Asha Rao',
      courseName: 'Graphology',
      organizationName: 'Academy',
      organizationLogoUrl: null,
      completedAt: '2026-07-01T00:00:00.000Z',
      issuedAt: '2026-07-02T00:00:00.000Z',
      revokedAt: null,
    });
    expect(dto.status).toBe('VALID');
    expect(dto.verificationUrl).toBe('http://localhost:3000/verify/VERIFY-001');
    expect(dto).not.toHaveProperty('id');
    expect(dto).not.toHaveProperty('organizationId');
  });
});

describe('certificate query mappers', () => {
  it('maps UI filters to API enums', () => {
    expect(toCertificateApiStatus('all')).toBeUndefined();
    expect(toCertificateApiStatus('issued')).toBe('ISSUED');
    expect(toCertificateListSort('newest')).toEqual({
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  });
});
