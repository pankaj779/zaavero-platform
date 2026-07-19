import './load-env.js';
import { hash } from 'argon2';
import {
  seedAdminEnvSchema,
  seedEmailTemplateSchema,
  seedOrganizationSchema,
  seedPlanSchema,
  seedPermissionSchema,
  seedRoleSchema,
  seedStudentEnvSchema,
  seedSystemSettingSchema,
  seedTeacherEnvSchema,
} from '../src/validation/seed.schema.js';

const {
  PrismaClient,
  OrganizationMemberStatus,
  CourseDifficulty,
  CourseStatus,
  BatchStatus,
  EnrollmentStatus,
  LessonContentType,
  PlanTier,
  BillingInterval,
  EmailCategory,
  EmailTemplateStatus,
  AIPromptTemplateStatus,
  AIFeature,
} = await import('@prisma/client');
const prisma = new PrismaClient();

const ROLES = [
  { name: 'Admin', description: 'Full platform administration access', isSystem: true },
  { name: 'Teacher', description: 'Teaching and batch management access', isSystem: true },
  { name: 'Student', description: 'Student learning portal access', isSystem: true },
  { name: 'Parent', description: 'Parent dashboard access', isSystem: true },
] as const;

const PERMISSIONS = [
  { name: 'course.create', module: 'course', description: 'Create courses' },
  { name: 'course.update', module: 'course', description: 'Update courses' },
  { name: 'student.view', module: 'student', description: 'View student records' },
  { name: 'teacher.update', module: 'teacher', description: 'Update teacher records' },
  { name: 'payment.manage', module: 'payment', description: 'Manage payments' },
  { name: 'email.view', module: 'email', description: 'View email delivery records' },
  { name: 'email.manage', module: 'email', description: 'Manage queued email' },
  { name: 'email.template.manage', module: 'email', description: 'Manage email templates' },
  { name: 'email.retry', module: 'email', description: 'Retry failed email deliveries' },
  { name: 'storage.upload', module: 'storage', description: 'Upload and attach media assets' },
  { name: 'storage.manage', module: 'storage', description: 'Manage organization media assets' },
  { name: 'ai.use', module: 'ai', description: 'Use AI chat and tutor features' },
  { name: 'ai.generate', module: 'ai', description: 'Generate AI content (quiz, summaries, copy)' },
  { name: 'ai.manage', module: 'ai', description: 'Manage AI documents and indexing jobs' },
  { name: 'ai.admin', module: 'ai', description: 'View AI usage, quotas, and admin insights' },
] as const;

const SYSTEM_SETTINGS = [
  { key: 'site_name', value: 'Graphology Platform', description: 'Public site name' },
  { key: 'maintenance_mode', value: 'false', description: 'Platform maintenance toggle' },
  { key: 'support_email', value: 'support@graphology.local', description: 'Support contact email' },
  { key: 'timezone', value: 'Asia/Kolkata', description: 'Default platform timezone' },
  { key: 'currency', value: 'INR', description: 'Default platform currency' },
] as const;

const DEFAULT_ORGANIZATION = {
  name: 'Graphology Academy',
  slug: 'graphology-academy',
  email: 'admin@graphology.local',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  language: 'en',
  isActive: true,
} as const;

const DEFAULT_PLANS = [
  {
    tier: PlanTier.FREE,
    name: 'Free',
    description: 'Essential LMS tools for small teams getting started.',
    interval: BillingInterval.MONTHLY,
    amountMinor: 0,
    currency: 'INR',
    trialDays: 0,
    features: {
      maxStudents: 25,
      maxTeachers: 2,
      analytics: false,
      prioritySupport: false,
    },
    isActive: true,
  },
  {
    tier: PlanTier.BASIC,
    name: 'Basic',
    description: 'Core teaching and administration tools for growing academies.',
    interval: BillingInterval.MONTHLY,
    amountMinor: 99_900,
    currency: 'INR',
    trialDays: 14,
    features: {
      maxStudents: 250,
      maxTeachers: 10,
      analytics: true,
      prioritySupport: false,
    },
    isActive: true,
  },
  {
    tier: PlanTier.PROFESSIONAL,
    name: 'Professional',
    description: 'Advanced LMS capabilities for established education businesses.',
    interval: BillingInterval.MONTHLY,
    amountMinor: 249_900,
    currency: 'INR',
    trialDays: 14,
    features: {
      maxStudents: 1_000,
      maxTeachers: 50,
      analytics: true,
      prioritySupport: true,
    },
    isActive: true,
  },
  {
    tier: PlanTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'High-capacity LMS plan with enterprise support and controls.',
    interval: BillingInterval.MONTHLY,
    amountMinor: 599_900,
    currency: 'INR',
    trialDays: 30,
    features: {
      maxStudents: null,
      maxTeachers: null,
      analytics: true,
      prioritySupport: true,
    },
    isActive: true,
  },
] as const;

const EMAIL_TEMPLATE_SPECS = [
  ['welcome', 'Welcome', 'Welcome to the platform. Your account is ready.', EmailCategory.SYSTEM],
  [
    'verify_email',
    'Verify your email',
    'Confirm your email address to finish setting up your account.',
    EmailCategory.SECURITY,
  ],
  [
    'forgot_password',
    'Reset your password',
    'Use the secure link to choose a new password.',
    EmailCategory.SECURITY,
  ],
  [
    'password_changed',
    'Your password was changed',
    'Your account password was changed. Review your account if this was unexpected.',
    EmailCategory.SECURITY,
  ],
  [
    'teacher_invitation',
    'Teacher invitation',
    'You have been invited to join as a teacher.',
    EmailCategory.SYSTEM,
  ],
  [
    'student_invitation',
    'Student invitation',
    'You have been invited to join as a student.',
    EmailCategory.SYSTEM,
  ],
  [
    'organization_invitation',
    'Organization invitation',
    'You have been invited to join an organization.',
    EmailCategory.SYSTEM,
  ],
  [
    'course_enrollment',
    'Course enrollment confirmed',
    'Your course enrollment is confirmed.',
    EmailCategory.COURSE,
  ],
  [
    'batch_enrollment',
    'Batch enrollment confirmed',
    'Your batch enrollment is confirmed.',
    EmailCategory.COURSE,
  ],
  [
    'lesson_published',
    'New lesson published',
    'A new lesson is available in your course.',
    EmailCategory.COURSE,
  ],
  [
    'assignment_published',
    'New assignment published',
    'A new assignment is available.',
    EmailCategory.ASSIGNMENT,
  ],
  [
    'assignment_due',
    'Assignment due reminder',
    'An assignment due date is approaching.',
    EmailCategory.ASSIGNMENT,
  ],
  [
    'assignment_submitted',
    'Assignment submitted',
    'An assignment submission was received.',
    EmailCategory.ASSIGNMENT,
  ],
  [
    'assignment_graded',
    'Assignment graded',
    'Your assignment has been graded.',
    EmailCategory.ASSIGNMENT,
  ],
  [
    'certificate_issued',
    'Certificate issued',
    'Your certificate is ready.',
    EmailCategory.CERTIFICATE,
  ],
  [
    'payment_successful',
    'Payment successful',
    'Your payment was completed successfully.',
    EmailCategory.PAYMENT,
  ],
  [
    'invoice_available',
    'Invoice available',
    'Your invoice is available to view.',
    EmailCategory.PAYMENT,
  ],
  [
    'refund_processed',
    'Refund processed',
    'Your refund has been processed.',
    EmailCategory.PAYMENT,
  ],
  [
    'subscription_started',
    'Subscription started',
    'Your subscription is now active.',
    EmailCategory.PAYMENT,
  ],
  [
    'subscription_renewed',
    'Subscription renewed',
    'Your subscription has been renewed.',
    EmailCategory.PAYMENT,
  ],
  [
    'subscription_cancelled',
    'Subscription cancelled',
    'Your subscription has been cancelled.',
    EmailCategory.PAYMENT,
  ],
  [
    'live_reminder',
    'Live class reminder',
    'Your live class will begin soon.',
    EmailCategory.LIVE_CLASS,
  ],
  [
    'live_cancelled',
    'Live class cancelled',
    'A scheduled live class has been cancelled.',
    EmailCategory.LIVE_CLASS,
  ],
  [
    'announcement',
    'New announcement',
    'A new announcement has been published.',
    EmailCategory.ANNOUNCEMENT,
  ],
  ['general_notification', 'Notification', 'You have a new notification.', EmailCategory.SYSTEM],
] as const;

const SYSTEM_EMAIL_TEMPLATES = EMAIL_TEMPLATE_SPECS.map(([key, title, message, category]) => ({
  scopeKey: 'SYSTEM' as const,
  key,
  locale: 'en',
  version: 1,
  subject: title,
  html: [
    '<!doctype html>',
    '<html lang="en"><body>',
    '<main>',
    '<p>Hello {{recipientName}},</p>',
    `<p>${message}</p>`,
    '<p><a href="{{actionUrl}}">View details</a></p>',
    '<p>If you did not expect this message, you can safely ignore it.</p>',
    '</main>',
    '</body></html>',
  ].join(''),
  text: `Hello {{recipientName}},\n\n${message}\n\nView details: {{actionUrl}}\n\nIf you did not expect this message, you can safely ignore it.`,
  preview: message,
  variableSchema: {
    type: 'object' as const,
    properties: {
      recipientName: {
        type: 'string' as const,
        description: 'Display name of the recipient.',
      },
      actionUrl: {
        type: 'string' as const,
        format: 'uri' as const,
        description: 'Absolute HTTPS URL for the primary action.',
      },
    },
    required: ['recipientName', 'actionUrl'],
    additionalProperties: false as const,
  },
  category,
  status: EmailTemplateStatus.ACTIVE as const,
}));

const SYSTEM_AI_PROMPT_FEATURES = [
  ['tutor', AIFeature.TUTOR, 'AI Tutor', 'You are a helpful course tutor. Use only provided context and never invent facts.'],
  ['lesson_summary', AIFeature.LESSON_SUMMARY, 'Lesson Summary', 'Generate accurate lesson summaries without adding unsupported claims.'],
  ['assignment_help', AIFeature.ASSIGNMENT_HELP, 'Assignment Help', 'Guide the learner with hints and steps. Never reveal final answers or graded solutions.'],
  ['quiz_generator', AIFeature.QUIZ_GENERATOR, 'Quiz Generator', 'Generate assessment items aligned to lesson objectives in valid JSON when requested.'],
  ['flashcards', AIFeature.FLASHCARDS, 'Flashcards', 'Generate concise flashcards suitable for export.'],
  ['course_description', AIFeature.COURSE_DESCRIPTION, 'Course Description', 'Write compelling course copy grounded in supplied course details.'],
  ['certificate_feedback', AIFeature.CERTIFICATE_FEEDBACK, 'Certificate Feedback', 'Write personalized certificate remarks based on supplied achievement data.'],
  ['announcement_writer', AIFeature.ANNOUNCEMENT_WRITER, 'Announcement Writer', 'Draft polished teacher announcements from short prompts.'],
  ['email_writer', AIFeature.EMAIL_WRITER, 'Email Writer', 'Draft professional email copy without sending messages.'],
  ['performance_insights', AIFeature.PERFORMANCE_INSIGHTS, 'Performance Insights', 'Summarize supplied LMS metrics only. Never fabricate analytics.'],
  ['admin_insights', AIFeature.ADMIN_INSIGHTS, 'Admin Insights', 'Summarize supplied organization metrics only. Never fabricate analytics.'],
  ['semantic_search', AIFeature.SEMANTIC_SEARCH, 'Semantic Search', 'Use retrieved document excerpts to answer search-oriented questions.'],
  ['general', AIFeature.GENERAL, 'General Assistant', 'Provide helpful, safe responses within the learning platform context.'],
] as const;

const SYSTEM_AI_PROMPT_TEMPLATES = SYSTEM_AI_PROMPT_FEATURES.map(
  ([key, feature, title, systemPrompt]) => ({
    scopeKey: 'system' as const,
    key,
    locale: 'en',
    version: 1,
    feature,
    title,
    systemPrompt,
    userTemplate: '{{prompt}}',
    variableSchema: {
      type: 'object' as const,
      properties: {
        prompt: { type: 'string' as const },
      },
      additionalProperties: true as const,
    },
    status: AIPromptTemplateStatus.ACTIVE as const,
  }),
);

const SAMPLE_COURSE_SLUG = 'sample-course';

async function seedRoles(): Promise<Map<string, string>> {
  const roleIds = new Map<string, string>();

  for (const role of ROLES) {
    const validated = seedRoleSchema.parse(role);
    const record = await prisma.role.upsert({
      where: { name: validated.name },
      update: {
        description: validated.description,
        isSystem: validated.isSystem,
      },
      create: validated,
    });
    roleIds.set(record.name, record.id);
  }

  return roleIds;
}

async function seedPermissions(): Promise<Map<string, string>> {
  const permissionIds = new Map<string, string>();

  for (const permission of PERMISSIONS) {
    const validated = seedPermissionSchema.parse(permission);
    const record = await prisma.permission.upsert({
      where: { name: validated.name },
      update: {
        module: validated.module,
        description: validated.description,
      },
      create: validated,
    });
    permissionIds.set(record.name, record.id);
  }

  return permissionIds;
}

async function seedRolePermissions(
  roleIds: Map<string, string>,
  permissionIds: Map<string, string>,
): Promise<void> {
  const adminRoleId = roleIds.get('Admin');
  const teacherRoleId = roleIds.get('Teacher');

  if (!adminRoleId) {
    throw new Error('Admin role was not seeded.');
  }

  if (!teacherRoleId) {
    throw new Error('Teacher role was not seeded.');
  }

  for (const permissionId of permissionIds.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRoleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRoleId,
        permissionId,
      },
    });
  }

  const teacherPermissionNames = [
    'course.create',
    'course.update',
    'storage.upload',
    'ai.use',
    'ai.generate',
    'ai.manage',
  ] as const;

  for (const permissionName of teacherPermissionNames) {
    const permissionId = permissionIds.get(permissionName);
    if (!permissionId) {
      throw new Error(`Permission ${permissionName} was not seeded.`);
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: teacherRoleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: teacherRoleId,
        permissionId,
      },
    });
  }

  const studentRoleId = roleIds.get('Student');
  if (!studentRoleId) {
    throw new Error('Student role was not seeded.');
  }

  const studentPermissionNames = ['ai.use'] as const;
  for (const permissionName of studentPermissionNames) {
    const permissionId = permissionIds.get(permissionName);
    if (!permissionId) {
      throw new Error(`Permission ${permissionName} was not seeded.`);
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: studentRoleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: studentRoleId,
        permissionId,
      },
    });
  }
}

async function seedSystemSettings(): Promise<void> {
  for (const setting of SYSTEM_SETTINGS) {
    const validated = seedSystemSettingSchema.parse(setting);
    await prisma.systemSetting.upsert({
      where: { key: validated.key },
      update: {
        value: validated.value,
        description: validated.description,
      },
      create: validated,
    });
  }
}

async function seedDefaultOrganization(): Promise<string> {
  const validated = seedOrganizationSchema.parse(DEFAULT_ORGANIZATION);

  const organization = await prisma.organization.upsert({
    where: { slug: validated.slug },
    update: {
      name: validated.name,
      email: validated.email,
      timezone: validated.timezone,
      currency: validated.currency,
      language: validated.language,
      isActive: validated.isActive,
    },
    create: validated,
  });

  return organization.id;
}

async function seedPlans(organizationId: string): Promise<void> {
  for (const plan of DEFAULT_PLANS) {
    const validated = seedPlanSchema.parse(plan);

    await prisma.plan.upsert({
      where: {
        organizationId_tier_interval: {
          organizationId,
          tier: validated.tier,
          interval: validated.interval,
        },
      },
      update: {
        name: validated.name,
        description: validated.description,
        amountMinor: validated.amountMinor,
        currency: validated.currency,
        trialDays: validated.trialDays,
        features: validated.features,
        isActive: validated.isActive,
      },
      create: {
        organizationId,
        ...validated,
      },
    });
  }
}

async function seedEmailTemplates(): Promise<void> {
  for (const template of SYSTEM_EMAIL_TEMPLATES) {
    const validated = seedEmailTemplateSchema.parse(template);

    await prisma.emailTemplate.upsert({
      where: {
        scopeKey_key_locale_version: {
          scopeKey: validated.scopeKey,
          key: validated.key,
          locale: validated.locale,
          version: validated.version,
        },
      },
      update: {},
      create: validated,
    });
  }
}

async function seedAIPromptTemplates(): Promise<void> {
  for (const template of SYSTEM_AI_PROMPT_TEMPLATES) {
    await prisma.aIPromptTemplate.upsert({
      where: {
        scopeKey_key_locale_version: {
          scopeKey: template.scopeKey,
          key: template.key,
          locale: template.locale,
          version: template.version,
        },
      },
      update: {
        feature: template.feature,
        title: template.title,
        systemPrompt: template.systemPrompt,
        userTemplate: template.userTemplate,
        variableSchema: template.variableSchema,
        status: template.status,
      },
      create: template,
    });
  }
}

async function assignRole(userId: string, roleId: string): Promise<void> {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });
}

async function seedOrganizationMembership(organizationId: string, userId: string): Promise<void> {
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    update: {
      status: OrganizationMemberStatus.ACTIVE,
    },
    create: {
      organizationId,
      userId,
      status: OrganizationMemberStatus.ACTIVE,
    },
  });
}

async function upsertUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  const passwordHash = await hash(params.password);

  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      passwordHash,
      emailVerified: true,
      isActive: true,
    },
    create: {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      passwordHash,
      emailVerified: true,
      isActive: true,
    },
  });

  return user.id;
}

async function seedAdminUser(roleIds: Map<string, string>): Promise<string> {
  const adminEnv = seedAdminEnvSchema.parse({
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    SEED_ADMIN_FIRST_NAME: process.env.SEED_ADMIN_FIRST_NAME ?? 'System',
    SEED_ADMIN_LAST_NAME: process.env.SEED_ADMIN_LAST_NAME ?? 'Administrator',
  });

  const adminRoleId = roleIds.get('Admin');
  if (!adminRoleId) {
    throw new Error('Admin role was not seeded.');
  }

  const adminUserId = await upsertUser({
    email: adminEnv.SEED_ADMIN_EMAIL,
    password: adminEnv.SEED_ADMIN_PASSWORD,
    firstName: adminEnv.SEED_ADMIN_FIRST_NAME,
    lastName: adminEnv.SEED_ADMIN_LAST_NAME,
  });

  await assignRole(adminUserId, adminRoleId);
  return adminUserId;
}

async function seedTeacherUser(
  roleIds: Map<string, string>,
  fallbackPassword: string,
): Promise<string> {
  const teacherEnv = seedTeacherEnvSchema.parse({
    SEED_TEACHER_EMAIL: process.env.SEED_TEACHER_EMAIL,
    SEED_TEACHER_PASSWORD: process.env.SEED_TEACHER_PASSWORD,
    SEED_TEACHER_FIRST_NAME: process.env.SEED_TEACHER_FIRST_NAME,
    SEED_TEACHER_LAST_NAME: process.env.SEED_TEACHER_LAST_NAME,
  });

  const teacherRoleId = roleIds.get('Teacher');
  if (!teacherRoleId) {
    throw new Error('Teacher role was not seeded.');
  }

  const teacherUserId = await upsertUser({
    email: teacherEnv.SEED_TEACHER_EMAIL,
    password: teacherEnv.SEED_TEACHER_PASSWORD ?? fallbackPassword,
    firstName: teacherEnv.SEED_TEACHER_FIRST_NAME,
    lastName: teacherEnv.SEED_TEACHER_LAST_NAME,
  });

  await assignRole(teacherUserId, teacherRoleId);
  return teacherUserId;
}

async function seedStudentUser(
  roleIds: Map<string, string>,
  fallbackPassword: string,
): Promise<string> {
  const studentEnv = seedStudentEnvSchema.parse({
    SEED_STUDENT_EMAIL: process.env.SEED_STUDENT_EMAIL,
    SEED_STUDENT_PASSWORD: process.env.SEED_STUDENT_PASSWORD,
    SEED_STUDENT_FIRST_NAME: process.env.SEED_STUDENT_FIRST_NAME,
    SEED_STUDENT_LAST_NAME: process.env.SEED_STUDENT_LAST_NAME,
  });

  const studentRoleId = roleIds.get('Student');
  if (!studentRoleId) {
    throw new Error('Student role was not seeded.');
  }

  const studentUserId = await upsertUser({
    email: studentEnv.SEED_STUDENT_EMAIL,
    password: studentEnv.SEED_STUDENT_PASSWORD ?? fallbackPassword,
    firstName: studentEnv.SEED_STUDENT_FIRST_NAME,
    lastName: studentEnv.SEED_STUDENT_LAST_NAME,
  });

  await assignRole(studentUserId, studentRoleId);
  return studentUserId;
}

async function seedTeacherProfile(organizationId: string, userId: string): Promise<string> {
  const profile = await prisma.teacherProfile.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    update: {
      bio: 'Sample teacher profile for schema verification.',
      qualifications: ['Certified Instructor'],
      specializations: ['Online Teaching'],
      experienceYears: 5,
      deletedAt: null,
    },
    create: {
      organizationId,
      userId,
      bio: 'Sample teacher profile for schema verification.',
      qualifications: ['Certified Instructor'],
      specializations: ['Online Teaching'],
      experienceYears: 5,
    },
  });

  return profile.id;
}

async function seedStudentProfile(organizationId: string, userId: string): Promise<string> {
  const profile = await prisma.studentProfile.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    update: {
      deletedAt: null,
    },
    create: {
      organizationId,
      userId,
    },
  });

  return profile.id;
}

async function seedSampleLmsGraph(params: {
  organizationId: string;
  teacherProfileId: string;
  studentProfileId: string;
}): Promise<void> {
  const course = await prisma.course.upsert({
    where: {
      organizationId_slug: {
        organizationId: params.organizationId,
        slug: SAMPLE_COURSE_SLUG,
      },
    },
    update: {
      teacherId: params.teacherProfileId,
      title: 'Sample Course',
      description: 'Minimal course used to verify the LMS schema.',
      difficulty: CourseDifficulty.BEGINNER,
      status: CourseStatus.PUBLISHED,
      language: 'en',
      deletedAt: null,
    },
    create: {
      organizationId: params.organizationId,
      teacherId: params.teacherProfileId,
      title: 'Sample Course',
      slug: SAMPLE_COURSE_SLUG,
      description: 'Minimal course used to verify the LMS schema.',
      difficulty: CourseDifficulty.BEGINNER,
      status: CourseStatus.PUBLISHED,
      language: 'en',
    },
  });

  const existingModule = await prisma.courseModule.findFirst({
    where: {
      organizationId: params.organizationId,
      courseId: course.id,
      title: 'Getting Started',
      deletedAt: null,
    },
  });

  const courseModule =
    existingModule ??
    (await prisma.courseModule.create({
      data: {
        organizationId: params.organizationId,
        courseId: course.id,
        title: 'Getting Started',
        description: 'First module for schema verification.',
        displayOrder: 1,
      },
    }));

  const existingLesson = await prisma.lesson.findFirst({
    where: {
      organizationId: params.organizationId,
      moduleId: courseModule.id,
      title: 'Welcome Lesson',
      deletedAt: null,
    },
  });

  if (!existingLesson) {
    await prisma.lesson.create({
      data: {
        organizationId: params.organizationId,
        moduleId: courseModule.id,
        title: 'Welcome Lesson',
        description: 'Introductory video lesson for schema verification.',
        contentType: LessonContentType.VIDEO,
        contentUrl: 'https://example.com/sample-lesson',
        durationSeconds: 600,
        displayOrder: 1,
      },
    });
  }

  const batch = await prisma.batch.upsert({
    where: {
      courseId_name: {
        courseId: course.id,
        name: 'Sample Batch',
      },
    },
    update: {
      organizationId: params.organizationId,
      teacherId: params.teacherProfileId,
      status: BatchStatus.ACTIVE,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      maxStudents: 50,
      deletedAt: null,
    },
    create: {
      organizationId: params.organizationId,
      courseId: course.id,
      teacherId: params.teacherProfileId,
      name: 'Sample Batch',
      status: BatchStatus.ACTIVE,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
      maxStudents: 50,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      batchId_studentId: {
        batchId: batch.id,
        studentId: params.studentProfileId,
      },
    },
    update: {
      organizationId: params.organizationId,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
      completedAt: null,
    },
    create: {
      organizationId: params.organizationId,
      courseId: course.id,
      batchId: batch.id,
      studentId: params.studentProfileId,
      status: EnrollmentStatus.ACTIVE,
    },
  });
}

async function main(): Promise<void> {
  const roleIds = await seedRoles();
  const permissionIds = await seedPermissions();
  await seedRolePermissions(roleIds, permissionIds);
  await seedSystemSettings();
  await seedEmailTemplates();
  await seedAIPromptTemplates();

  const organizationId = await seedDefaultOrganization();
  await seedPlans(organizationId);

  const adminEnv = seedAdminEnvSchema.parse({
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    SEED_ADMIN_FIRST_NAME: process.env.SEED_ADMIN_FIRST_NAME ?? 'System',
    SEED_ADMIN_LAST_NAME: process.env.SEED_ADMIN_LAST_NAME ?? 'Administrator',
  });

  const adminUserId = await seedAdminUser(roleIds);
  const teacherUserId = await seedTeacherUser(roleIds, adminEnv.SEED_ADMIN_PASSWORD);
  const studentUserId = await seedStudentUser(roleIds, adminEnv.SEED_ADMIN_PASSWORD);

  await seedOrganizationMembership(organizationId, adminUserId);
  await seedOrganizationMembership(organizationId, teacherUserId);
  await seedOrganizationMembership(organizationId, studentUserId);

  const teacherProfileId = await seedTeacherProfile(organizationId, teacherUserId);
  const studentProfileId = await seedStudentProfile(organizationId, studentUserId);

  await seedSampleLmsGraph({
    organizationId,
    teacherProfileId,
    studentProfileId,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('Database seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
