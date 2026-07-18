import { z } from 'zod';

export const seedAdminEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().email(),
  SEED_ADMIN_PASSWORD: z.string().min(8),
  SEED_ADMIN_FIRST_NAME: z.string().min(1).default('System'),
  SEED_ADMIN_LAST_NAME: z.string().min(1).default('Administrator'),
});

export const seedTeacherEnvSchema = z.object({
  SEED_TEACHER_EMAIL: z.string().email().default('teacher@graphology.local'),
  SEED_TEACHER_PASSWORD: z.string().min(8).optional(),
  SEED_TEACHER_FIRST_NAME: z.string().min(1).default('Sample'),
  SEED_TEACHER_LAST_NAME: z.string().min(1).default('Teacher'),
});

export const seedStudentEnvSchema = z.object({
  SEED_STUDENT_EMAIL: z.string().email().default('student@graphology.local'),
  SEED_STUDENT_PASSWORD: z.string().min(8).optional(),
  SEED_STUDENT_FIRST_NAME: z.string().min(1).default('Sample'),
  SEED_STUDENT_LAST_NAME: z.string().min(1).default('Student'),
});

export const seedRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isSystem: z.boolean().default(true),
});

export const seedPermissionSchema = z.object({
  name: z.string().min(1),
  module: z.string().min(1),
  description: z.string().optional(),
});

export const seedSystemSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
});

export const seedOrganizationSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  email: z.string().email().optional(),
  timezone: z.string().min(1).default('Asia/Kolkata'),
  currency: z.string().min(1).default('INR'),
  language: z.string().min(1).default('en'),
  isActive: z.boolean().default(true),
});

export const seedPlanSchema = z.object({
  tier: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']),
  name: z.string().min(1),
  description: z.string().min(1),
  interval: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code'),
  trialDays: z.number().int().nonnegative(),
  features: z.object({
    maxStudents: z.number().int().positive().nullable(),
    maxTeachers: z.number().int().positive().nullable(),
    analytics: z.boolean(),
    prioritySupport: z.boolean(),
  }),
  isActive: z.boolean(),
});

const emailVariableDefinitionSchema = z.object({
  type: z.literal('string'),
  format: z.enum(['email', 'uri', 'date-time']).optional(),
  description: z.string().min(1),
});

export const seedEmailTemplateSchema = z.object({
  scopeKey: z.literal('SYSTEM'),
  key: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, 'Template key must be snake_case'),
  locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, 'Locale must be a language tag'),
  version: z.number().int().positive(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().min(1),
  preview: z.string().min(1),
  variableSchema: z.object({
    type: z.literal('object'),
    properties: z.record(emailVariableDefinitionSchema),
    required: z.array(z.string().min(1)),
    additionalProperties: z.literal(false),
  }),
  category: z.enum([
    'SECURITY',
    'SYSTEM',
    'MARKETING',
    'ANNOUNCEMENT',
    'ASSIGNMENT',
    'COURSE',
    'PAYMENT',
    'CERTIFICATE',
    'LIVE_CLASS',
  ]),
  status: z.literal('ACTIVE'),
});

export type SeedAdminEnv = z.infer<typeof seedAdminEnvSchema>;
export type SeedTeacherEnv = z.infer<typeof seedTeacherEnvSchema>;
export type SeedStudentEnv = z.infer<typeof seedStudentEnvSchema>;
export type SeedRole = z.infer<typeof seedRoleSchema>;
export type SeedPermission = z.infer<typeof seedPermissionSchema>;
export type SeedSystemSetting = z.infer<typeof seedSystemSettingSchema>;
export type SeedOrganization = z.infer<typeof seedOrganizationSchema>;
export type SeedPlan = z.infer<typeof seedPlanSchema>;
export type SeedEmailTemplate = z.infer<typeof seedEmailTemplateSchema>;
