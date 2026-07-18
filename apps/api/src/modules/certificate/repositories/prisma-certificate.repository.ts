import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@graphology/database';
import { PRISMA_CLIENT } from '../../../database/database.constants';
import type {
  BatchContextRecord,
  CertificateListFilters,
  CertificateListResult,
  CertificateRecord,
  CertificateRepository,
  CourseContextRecord,
  IssueCertificateData,
  UpdateCertificateData,
} from '../interfaces/certificate-repository.interface';

const certificateSelect = {
  id: true,
  organizationId: true,
  studentId: true,
  courseId: true,
  batchId: true,
  templateId: true,
  status: true,
  certificateNumber: true,
  verificationCode: true,
  pdfUrl: true,
  qrImageUrl: true,
  completedAt: true,
  issuedAt: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaCertificateRepository implements CertificateRepository {
  public readonly marker = 'certificate-repository' as const;

  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async findById(id: string): Promise<CertificateRecord | null> {
    return this.prisma.certificate.findFirst({
      where: { id },
      select: certificateSelect,
    });
  }

  async findByVerificationCode(verificationCode: string): Promise<CertificateRecord | null> {
    return this.prisma.certificate.findFirst({
      where: { verificationCode },
      select: certificateSelect,
    });
  }

  async findMany(filters: CertificateListFilters): Promise<CertificateListResult> {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            certificateNumber: {
              contains: filters.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.certificate.findMany({
        where,
        select: certificateSelect,
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip,
        take: filters.limit,
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return { items, total };
  }

  async findCourseContext(courseId: string): Promise<CourseContextRecord | null> {
    return this.prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        teacherId: true,
      },
    });
  }

  async findBatchContext(batchId: string): Promise<BatchContextRecord | null> {
    return this.prisma.batch.findFirst({
      where: {
        id: batchId,
        deletedAt: null,
      },
      select: {
        id: true,
        organizationId: true,
        courseId: true,
      },
    });
  }

  async studentProfileExistsInOrganization(
    organizationId: string,
    studentProfileId: string,
  ): Promise<boolean> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentProfileId,
        organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile !== null;
  }

  async findStudentProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.studentProfile.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile?.id ?? null;
  }

  async findTeacherProfileId(organizationId: string, userId: string): Promise<string | null> {
    const profile = await this.prisma.teacherProfile.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return profile?.id ?? null;
  }

  async issue(data: IssueCertificateData): Promise<CertificateRecord> {
    return this.prisma.certificate.create({
      data: {
        organizationId: data.organizationId,
        studentId: data.studentId,
        courseId: data.courseId,
        batchId: data.batchId ?? null,
        templateId: data.templateId ?? null,
        status: 'ISSUED',
        certificateNumber: data.certificateNumber,
        verificationCode: data.verificationCode,
        pdfUrl: data.pdfUrl ?? null,
        qrImageUrl: data.qrImageUrl ?? null,
        completedAt: data.completedAt ?? null,
        issuedAt: data.issuedAt,
      },
      select: certificateSelect,
    });
  }

  async update(id: string, data: UpdateCertificateData): Promise<CertificateRecord> {
    return this.prisma.certificate.update({
      where: { id },
      data: {
        ...(data.templateId !== undefined ? { templateId: data.templateId } : {}),
        ...(data.pdfUrl !== undefined ? { pdfUrl: data.pdfUrl } : {}),
        ...(data.qrImageUrl !== undefined ? { qrImageUrl: data.qrImageUrl } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      select: certificateSelect,
    });
  }

  async revoke(id: string, revokedAt: Date): Promise<CertificateRecord> {
    return this.prisma.certificate.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt,
      },
      select: certificateSelect,
    });
  }
}
